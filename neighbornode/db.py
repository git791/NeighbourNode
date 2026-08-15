import boto3
from boto3.dynamodb.conditions import Key, Attr
from neighbornode.config import settings

def get_table():
    dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
    return dynamodb.Table(settings.dynamodb_table_name)

def put_item(item: dict) -> None:
    table = get_table()
    table.put_item(Item=item)

def get_item(pk: str, sk: str) -> dict | None:
    table = get_table()
    response = table.get_item(Key={"PK": pk, "SK": sk})
    return response.get("Item")

def query_pk(pk: str, sk_prefix: str | None = None, limit: int = 100) -> list[dict]:
    table = get_table()
    kwargs = {"KeyConditionExpression": Key("PK").eq(pk), "Limit": limit}
    if sk_prefix:
        kwargs["KeyConditionExpression"] &= Key("SK").begins_with(sk_prefix)
    response = table.query(**kwargs)
    return response.get("Items", [])

def query_pk_sk_prefix(pk: str, sk_prefix: str) -> list[dict]:
    return query_pk(pk, sk_prefix)

def scan_by_status(entity_prefix: str, status: str) -> list[dict]:
    table = get_table()
    if entity_prefix == "OFFER":
        response = table.scan(
            FilterExpression=Attr("SK").begins_with("OFFER#") & Attr("status").eq(status)
        )
    else:
        response = table.scan(
            FilterExpression=Attr("PK").begins_with(entity_prefix) & Attr("status").eq(status)
        )
    return response.get("Items", [])

def update_item_attr(pk: str, sk: str, key: str, value) -> None:
    table = get_table()
    table.update_item(
        Key={"PK": pk, "SK": sk},
        UpdateExpression=f"SET #k = :v",
        ExpressionAttributeNames={"#k": key},
        ExpressionAttributeValues={":v": value}
    )
