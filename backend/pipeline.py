import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

GRANTS_GOV_URL = "https://apply07.grants.gov/grantsws/rest/opportunities/search/"

# Keywords that are relevant to our founder profiles
SEARCH_QUERIES = [
    "women entrepreneur",
    "minority small business",
    "women owned business",
    "underrepresented entrepreneur",
    "small business women",
    "minority owned business",
    "education technology",
    "edtech startup",
    "women STEM",
    "latina entrepreneur",
    "black owned business",
    "veteran entrepreneur",
    "immigrant entrepreneur",
]

def fetch_grants(keyword, rows=10):
    """Fetch grants from grants.gov API for a given keyword."""
    try:
        payload = {
            "keyword": keyword,
            "oppStatuses": "forecasted|posted",
            "rows": rows,
            "startRecordNum": 0
        }
        res = requests.post(GRANTS_GOV_URL, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        return data.get("oppHits", [])
    except Exception as e:
        print(f"  ⚠️  Failed to fetch '{keyword}': {e}")
        return []

def parse_deadline(date_str):
    """Convert grants.gov date format to YYYY-MM-DD."""
    if not date_str:
        return None
    for fmt in ["%m%d%Y", "%Y-%m-%d", "%m/%d/%Y"]:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except:
            continue
    return None

def already_exists(name):
    """Check if a fund with this name already exists in the database."""
    try:
        result = supabase.table("funding_sources")\
            .select("id")\
            .ilike("name", name)\
            .execute()
        return len(result.data) > 0
    except:
        return False

def insert_grant(opp):
    """Insert a single grant opportunity into Supabase."""
    name     = opp.get("title", "").strip()
    synopsis = opp.get("synopsis", "").strip()
    deadline = parse_deadline(opp.get("closeDate"))

    if not name:
        return False

    # Skip if already in database
    if already_exists(name):
        return False

    # Skip if deadline has passed
    if deadline:
        try:
            if datetime.strptime(deadline, "%Y-%m-%d") < datetime.now():
                return False
        except:
            pass

    row = {
        "name":        name,
        "type":        "government",
        "amount":      "Varies",
        "deadline":    deadline,
        "url":         f"https://www.grants.gov/search-grants?cfda={opp.get('cfdaList', [''])[0]}" if opp.get("cfdaList") else "https://grants.gov",
        "description": synopsis[:500] if synopsis else f"Federal grant opportunity: {name}",
        "criteria": {
            "gender":      ["any"],
            "stage":       ["any"],
            "sector":      ["any"],
            "location":    ["USA"],
            "ethnicity":   ["any"],
            "revenue_max": 99999999
        },
        "weights": {
            "gender":         5,
            "ethnicity":      5,
            "location":       15,
            "stage":          15,
            "sector":         15,
            "identity_bonus": 10,
            "revenue":        5
        }
    }

    try:
        supabase.table("funding_sources").insert(row).execute()
        return True
    except Exception as e:
        print(f"  ❌ Insert failed for '{name}': {e}")
        return False

def run_pipeline():
    print("=" * 50)
    print("FundNest — grants.gov Data Pipeline")
    print("=" * 50)

    # Get current count
    before = supabase.table("funding_sources").select("id", count="exact").execute()
    print(f"Sources before pipeline: {before.count}")
    print()

    total_inserted = 0
    total_skipped  = 0

    for keyword in SEARCH_QUERIES:
        print(f"🔍 Searching: '{keyword}'")
        grants = fetch_grants(keyword, rows=15)
        print(f"   Found {len(grants)} results")

        inserted = 0
        skipped  = 0
        for opp in grants:
            if insert_grant(opp):
                inserted += 1
            else:
                skipped += 1

        print(f"   ✅ Inserted: {inserted} | ⏭️  Skipped: {skipped}")
        total_inserted += inserted
        total_skipped  += skipped

    print()
    print("=" * 50)

    # Get new count
    after = supabase.table("funding_sources").select("id", count="exact").execute()
    print(f"Sources after pipeline:  {after.count}")
    print(f"New sources added:       {total_inserted}")
    print(f"Duplicates skipped:      {total_skipped}")
    print("=" * 50)

if __name__ == "__main__":
    run_pipeline()