"""
auth_handler.py — Cognito-backed auth for NeighborNode

Routes:
  POST /auth/register   body: {email, password, role, display_name, phone?, transport?}
  POST /auth/confirm    body: {email, code}
  POST /auth/signin     body: {email, password}
  GET  /auth/profile    header: Authorization: Bearer <id_token>
  PUT  /auth/profile    header: Authorization: Bearer <id_token>
                        body:  {display_name?, phone_number?, transport?}
  POST /auth/signout    header: Authorization: Bearer <access_token>

Cognito custom attributes stored on the user:
  custom:role         — host | donor | runner | coordinator
  custom:display_name — human-readable name shown in the UI
  custom:transport    — bicycle | car | walking  (runners only)

Per-user progress (donation count, delivery count) lives in DynamoDB under
  PK: USER#{cognito_sub}  SK: META
so it persists across sessions and devices.
"""
import json
import logging
import os
import sys

sys.path.insert(0, "/var/task")

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")

cognito = boto3.client("cognito-idp", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))

ALLOWED_ROLES = {"host", "donor", "runner", "coordinator"}


# ── helpers ──────────────────────────────────────────────────────────────────

def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }


def _parse_body(event: dict) -> dict:
    raw = event.get("body") or "{}"
    return json.loads(raw) if isinstance(raw, str) else (raw or {})


def _get_token(event: dict) -> str | None:
    """Extract Bearer token from Authorization header."""
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def _get_user_from_token(access_token: str) -> dict | None:
    """Call Cognito GetUser to verify token and return user attributes."""
    try:
        resp = cognito.get_user(AccessToken=access_token)
        attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
        attrs["username"] = resp.get("Username")
        return attrs
    except ClientError:
        return None


def _get_user_progress(sub: str) -> dict:
    """Read per-user progress from DynamoDB."""
    try:
        from neighbornode.db import get_item
        item = get_item(f"USER#{sub}", "META") or {}
        return {
            "donation_count": item.get("donation_count", 0),
            "delivery_count": item.get("delivery_count", 0),
            "joined_at": item.get("joined_at"),
        }
    except Exception:
        return {}


def _ensure_user_record(sub: str, role: str, display_name: str) -> None:
    """Create the DynamoDB user record on first sign-in if it doesn't exist."""
    import datetime
    try:
        from neighbornode.db import get_item, put_item
        existing = get_item(f"USER#{sub}", "META")
        if not existing:
            put_item({
                "PK": f"USER#{sub}",
                "SK": "META",
                "cognito_sub": sub,
                "role": role,
                "display_name": display_name,
                "donation_count": 0,
                "delivery_count": 0,
                "joined_at": datetime.datetime.utcnow().isoformat() + "Z",
            })
    except Exception as e:
        logger.warning(f"Could not create user record for {sub}: {e}")


# ── route handlers ────────────────────────────────────────────────────────────

def handle_register(body: dict) -> dict:
    """POST /auth/register — create a Cognito account and DynamoDB user record."""
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    role = body.get("role", "").strip().lower()
    display_name = body.get("display_name", "").strip()
    phone = body.get("phone_number", "").strip()
    transport = body.get("transport", "").strip()

    if not email or not password or not role or not display_name:
        return _response(400, {"error": "email, password, role, and display_name are required"})

    if role not in ALLOWED_ROLES:
        return _response(400, {"error": f"role must be one of: {', '.join(sorted(ALLOWED_ROLES))}"})

    user_attrs = [
        {"Name": "email", "Value": email},
        {"Name": "custom:role", "Value": role},
        {"Name": "custom:display_name", "Value": display_name},
    ]
    if phone:
        user_attrs.append({"Name": "phone_number", "Value": phone})
    if transport and role == "runner":
        user_attrs.append({"Name": "custom:transport", "Value": transport})

    try:
        resp = cognito.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=user_attrs,
        )
        return _response(200, {
            "success": True,
            "user_confirmed": resp.get("UserConfirmed", False),
            "message": "Check your email for a verification code.",
        })
    except ClientError as e:
        code = e.response["Error"]["Code"]
        msg = e.response["Error"]["Message"]
        if code == "UsernameExistsException":
            return _response(409, {"error": "An account with this email already exists."})
        logger.error(f"Registration error: {code}: {msg}")
        return _response(400, {"error": msg})


def handle_confirm(body: dict) -> dict:
    """POST /auth/confirm — verify email with the 6-digit code from Cognito."""
    email = body.get("email", "").strip().lower()
    code = body.get("code", "").strip()
    if not email or not code:
        return _response(400, {"error": "email and code are required"})

    try:
        cognito.confirm_sign_up(ClientId=CLIENT_ID, Username=email, ConfirmationCode=code)
        return _response(200, {"success": True, "message": "Email confirmed. You can now sign in."})
    except ClientError as e:
        code_err = e.response["Error"]["Code"]
        msg = e.response["Error"]["Message"]
        if code_err == "CodeMismatchException":
            return _response(400, {"error": "Incorrect verification code."})
        if code_err == "ExpiredCodeException":
            return _response(400, {"error": "Verification code expired. Request a new one."})
        return _response(400, {"error": msg})


def handle_signin(body: dict) -> dict:
    """POST /auth/signin — authenticate and return tokens + profile."""
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    if not email or not password:
        return _response(400, {"error": "email and password are required"})

    try:
        resp = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
            ClientId=CLIENT_ID,
        )
        auth = resp.get("AuthenticationResult", {})
        id_token = auth.get("IdToken")
        access_token = auth.get("AccessToken")
        refresh_token = auth.get("RefreshToken")

        # Fetch user attributes to build profile
        user = cognito.get_user(AccessToken=access_token)
        attrs = {a["Name"]: a["Value"] for a in user.get("UserAttributes", [])}
        sub = attrs.get("sub", "")
        role = attrs.get("custom:role", "")
        display_name = attrs.get("custom:display_name", "")

        # Ensure DynamoDB record exists (idempotent)
        _ensure_user_record(sub, role, display_name)
        progress = _get_user_progress(sub)

        return _response(200, {
            "success": True,
            "tokens": {
                "id_token": id_token,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": auth.get("ExpiresIn", 3600),
            },
            "profile": {
                "sub": sub,
                "email": attrs.get("email"),
                "role": role,
                "display_name": display_name,
                "phone_number": attrs.get("phone_number"),
                "transport": attrs.get("custom:transport"),
                **progress,
            },
        })
    except ClientError as e:
        code = e.response["Error"]["Code"]
        msg = e.response["Error"]["Message"]
        if code in ("NotAuthorizedException", "UserNotFoundException"):
            return _response(401, {"error": "Incorrect email or password."})
        if code == "UserNotConfirmedException":
            return _response(403, {"error": "Email not confirmed. Check your inbox for the verification code."})
        logger.error(f"Sign-in error: {code}: {msg}")
        return _response(400, {"error": msg})


def handle_get_profile(event: dict) -> dict:
    """GET /auth/profile — return full user profile + progress."""
    token = _get_token(event)
    if not token:
        return _response(401, {"error": "Missing Authorization header"})

    user = _get_user_from_token(token)
    if not user:
        return _response(401, {"error": "Invalid or expired token"})

    sub = user.get("sub", "")
    progress = _get_user_progress(sub)

    return _response(200, {
        "sub": sub,
        "email": user.get("email"),
        "role": user.get("custom:role"),
        "display_name": user.get("custom:display_name"),
        "phone_number": user.get("phone_number"),
        "transport": user.get("custom:transport"),
        **progress,
    })


def handle_update_profile(event: dict, body: dict) -> dict:
    """PUT /auth/profile — update display_name, phone_number, transport."""
    token = _get_token(event)
    if not token:
        return _response(401, {"error": "Missing Authorization header"})

    user = _get_user_from_token(token)
    if not user:
        return _response(401, {"error": "Invalid or expired token"})

    sub = user.get("sub", "")
    updates = []

    if "display_name" in body:
        updates.append({"Name": "custom:display_name", "Value": body["display_name"]})
    if "phone_number" in body:
        updates.append({"Name": "phone_number", "Value": body["phone_number"]})
    if "transport" in body and user.get("custom:role") == "runner":
        updates.append({"Name": "custom:transport", "Value": body["transport"]})

    if updates:
        try:
            cognito.update_user_attributes(AccessToken=token, UserAttributes=updates)
        except ClientError as e:
            return _response(400, {"error": e.response["Error"]["Message"]})

    # Also sync to DynamoDB for denormalized queries
    try:
        from neighbornode.db import update_item_attr
        for u in updates:
            key_map = {
                "custom:display_name": "display_name",
                "phone_number": "phone_number",
                "custom:transport": "transport",
            }
            db_key = key_map.get(u["Name"])
            if db_key:
                update_item_attr(f"USER#{sub}", "META", db_key, u["Value"])
    except Exception as e:
        logger.warning(f"DynamoDB profile sync failed: {e}")

    return _response(200, {"success": True, "message": "Profile updated."})


def handle_signout(event: dict) -> dict:
    """POST /auth/signout — globally invalidate all tokens for this user."""
    token = _get_token(event)
    if not token:
        return _response(401, {"error": "Missing Authorization header"})

    try:
        cognito.global_sign_out(AccessToken=token)
        return _response(200, {"success": True, "message": "Signed out on all devices."})
    except ClientError as e:
        return _response(400, {"error": e.response["Error"]["Message"]})


# ── main router ───────────────────────────────────────────────────────────────

def handler(event, context):
    path = event.get("rawPath", event.get("path", ""))
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    try:
        body = _parse_body(event)

        if path.endswith("/auth/register") and method == "POST":
            return handle_register(body)
        elif path.endswith("/auth/confirm") and method == "POST":
            return handle_confirm(body)
        elif path.endswith("/auth/signin") and method == "POST":
            return handle_signin(body)
        elif path.endswith("/auth/profile") and method == "GET":
            return handle_get_profile(event)
        elif path.endswith("/auth/profile") and method == "PUT":
            return handle_update_profile(event, body)
        elif path.endswith("/auth/signout") and method == "POST":
            return handle_signout(event)
        else:
            return _response(404, {"error": f"Not found: {method} {path}"})

    except Exception as exc:
        logger.exception("Auth handler unhandled error")
        return _response(500, {"error": str(exc)})
