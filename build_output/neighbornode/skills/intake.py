from strands.tools import tool
import json
import boto3
from neighbornode.config import settings

@tool
def parse_inbound_message(text: str, sender: str, channel: str) -> dict:
    """Classify and extract fields from an inbound free-text message."""
    try:
        bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        prompt = (
            f"Classify this inbound message from {sender} via {channel}:\n"
            f"Message: '{text}'\n"
            "Respond in JSON format with exactly these keys: type (status_update, donor_offer, runner_reply, or unknown), extracted_fields (dict of useful data like food_type, qty, status, fridge_name), and confidence (float 0-1)."
        )
        response = bedrock.converse(
            modelId=settings.bedrock_model_id_micro,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
        )
        result_text = response["output"]["message"]["content"][0]["text"]
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        data = json.loads(result_text)
        return {
            "type": data.get("type", "unknown"),
            "sender": sender,
            "raw_text": text,
            "extracted_fields": data.get("extracted_fields", {}),
            "confidence": data.get("confidence", 0.0)
        }
    except Exception as e:
        return {"type": "unknown", "sender": sender, "raw_text": text, "extracted_fields": {}, "confidence": 0.0, "error": str(e)}

@tool
def resolve_entity(name_guess: str, entity_type: str) -> dict:
    """Fuzzy match a user-provided name to a known entity ID (FRIDGE, DONOR, RUNNER)."""
    try:
        from neighbornode.db import get_table
        from boto3.dynamodb.conditions import Attr
        table = get_table()
        
        response = table.scan(
            FilterExpression=Attr("PK").begins_with(f"{entity_type}#") & Attr("SK").eq("META")
        )
        entities = response.get("Items", [])
        guess_lower = name_guess.lower()
        
        for e in entities:
            name = e.get("name", "").lower()
            address = e.get("address", "").lower()
            if guess_lower in name or name in guess_lower:
                return {"entity_id": e["PK"], "name": e.get("name"), "confidence": 0.9}
            if guess_lower in address or address in guess_lower:
                return {"entity_id": e["PK"], "name": e.get("name"), "confidence": 0.8}
                
        bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        entities_list = [{"id": e["PK"], "name": e.get("name"), "address": e.get("address")} for e in entities]
        prompt = (
            f"Given these entities: {json.dumps(entities_list)}\n"
            f"Which one best matches '{name_guess}'?\n"
            "Respond in JSON format with keys: entity_id (string or null), confidence (float 0-1)."
        )
        response = bedrock.converse(
            modelId=settings.bedrock_model_id_micro,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
        )
        result_text = response["output"]["message"]["content"][0]["text"]
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        data = json.loads(result_text)
        return {
            "entity_id": data.get("entity_id"),
            "name": next((e["name"] for e in entities if e["PK"] == data.get("entity_id")), None),
            "confidence": data.get("confidence", 0.0)
        }
    except Exception as e:
        return {"entity_id": None, "confidence": 0.0, "error": str(e)}

@tool
def translate_message(text: str, target_lang: str) -> dict:
    """Translate a message to the target language and detect the source language."""
    try:
        bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        prompt = (
            f"Translate the following text to {target_lang}. Also detect the source language.\n"
            f"Text: '{text}'\n"
            "Respond in JSON format with exactly these keys: translated_text, source_lang_detected."
        )
        response = bedrock.converse(
            modelId=settings.bedrock_model_id,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
        )
        result_text = response["output"]["message"]["content"][0]["text"]
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        data = json.loads(result_text)
        return {
            "translated_text": data.get("translated_text", text),
            "source_lang_detected": data.get("source_lang_detected", "unknown")
        }
    except Exception as e:
        return {"translated_text": text, "source_lang_detected": "unknown", "error": str(e)}
