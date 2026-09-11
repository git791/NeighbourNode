#!/usr/bin/env python3
"""
Local demo runner for NeighborNode.

Usage:
    python -m neighbornode.local_runner --seed data/seed_demo.json
    python -m neighbornode.local_runner --seed data/seed_demo.json --event "Crown st fridge is empty"
"""
import argparse
import json
import logging
import sys
from pathlib import Path

from neighbornode.config import settings, logger
from neighbornode.db import put_item

def seed_dynamodb(seed_path: str) -> None:
    """Write all seed entities to real DynamoDB."""
    data = json.loads(Path(seed_path).read_text())
    import datetime
    
    for fridge in data.get("fridges", []):
        put_item({
            "PK": f"FRIDGE#{fridge['id']}",
            "SK": "META",
            **{k: v for k, v in fridge.items() if k != "id"},
            "entity_id": fridge["id"],
        })
        logger.info(f"Seeded fridge: {fridge['name']}")
        
    for donor in data.get("donors", []):
        put_item({
            "PK": f"DONOR#{donor['id']}",
            "SK": "META",
            **{k: v for k, v in donor.items() if k != "id"},
            "entity_id": donor["id"],
        })
        logger.info(f"Seeded donor: {donor['name']}")
        
    for runner in data.get("runners", []):
        put_item({
            "PK": f"RUNNER#{runner['id']}",
            "SK": "META",
            **{k: v for k, v in runner.items() if k != "id"},
            "entity_id": runner["id"],
        })
        logger.info(f"Seeded runner: {runner['name']}")
        
    for offer in data.get("offers", []):
        ts = offer.get("created_at", datetime.datetime.utcnow().isoformat() + "Z")
        put_item({
            "PK": f"DONOR#{offer['donor_id']}",
            "SK": f"OFFER#{ts}",
            **{k: v for k, v in offer.items()},
            "entity_id": offer["id"],
        })
        logger.info(f"Seeded offer: {offer['food_type']}")

def run_demo_event(seed_path: str, custom_text: str | None = None) -> None:
    """Fire the demo event through the full orchestrator chain."""
    from neighbornode.agents.orchestrator import process_event
    
    data = json.loads(Path(seed_path).read_text())
    demo_events = data.get("demo_events", [])
    
    if not demo_events and not custom_text:
        logger.warning("No demo_events in seed file.")
        return
    
    event = demo_events[0] if demo_events else {"text": custom_text}
    text = custom_text or event["text"]
    sender = event.get("sender", "")
    channel = event.get("channel", "sms")
    
    print("\n" + "="*60)
    print("NeighborNode — Live Orchestrator Trace")
    print("="*60)
    print(f"INBOUND: \"{text}\" from {sender} via {channel}")
    print("-"*60)
    
    result = process_event(text=text, sender=sender, channel=channel)
    
    print("-"*60)
    print("ORCHESTRATOR RESULT:")
    print(result)
    print("="*60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="NeighborNode local demo runner")
    parser.add_argument("--seed", required=True, help="Path to seed JSON file (e.g. data/seed_demo.json)")
    parser.add_argument("--event", help="Custom event text to fire (overrides seed demo_events)")
    parser.add_argument("--seed-only", action="store_true", help="Only seed DynamoDB, do not fire demo event")
    args = parser.parse_args()
    
    print(f"Seeding DynamoDB table '{settings.dynamodb_table_name}' in {settings.aws_region}...")
    seed_dynamodb(args.seed)
    print("Seed complete.")
    
    if not args.seed_only:
        run_demo_event(args.seed, custom_text=args.event)

if __name__ == "__main__":
    main()
