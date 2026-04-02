import json
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

with open("data/funding_sources.json") as f:
    sources = json.load(f)

success = 0
failed  = 0

for s in sources:
    try:
        # Convert deadline string to proper date format
        deadline = s.get("deadline")
        if deadline and len(deadline) == 10:  # YYYY-MM-DD
            pass  # already correct format
        else:
            deadline = None

        row = {
            "name":        s["name"],
            "type":        s["type"],
            "amount":      s.get("amount"),
            "deadline":    deadline,
            "url":         s.get("url"),
            "description": s.get("description"),
            "criteria":    s.get("criteria", {}),
            "weights":     s.get("weights", {})
        }

        result = supabase.table("funding_sources").insert(row).execute()
        print(f"✅ Inserted: {s['name']}")
        success += 1

    except Exception as e:
        print(f"❌ Failed: {s['name']} — {e}")
        failed += 1

print(f"\nDone — {success} inserted, {failed} failed")