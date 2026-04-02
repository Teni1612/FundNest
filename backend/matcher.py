import json
import os
import math
from datetime import datetime, timezone
from anthropic import Anthropic
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Load embedding model once at startup
print("Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model ready.")

from supabase import create_client

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

print("Loading funding sources from database...")
result = supabase.table("funding_sources").select("*").execute()
FUNDING_SOURCES = result.data
print(f"Loaded {len(FUNDING_SOURCES)} funding sources from database.")

# Pre-compute fund embeddings at startup
print("Pre-computing fund embeddings...")
FUND_TEXTS = [
    f"{s['name']}. {s['description']}"
    for s in FUNDING_SOURCES
]
FUND_EMBEDDINGS = embedder.encode(FUND_TEXTS, convert_to_numpy=True)
print(f"Embeddings ready for {len(FUNDING_SOURCES)} funds.")

def normalize_stage(stage_str):
    s = stage_str.lower()
    if "idea" in s or "pre" in s:  return "pre-revenue"
    if "early" in s:               return "early"
    if "seed" in s:                return "seed"
    if "growth" in s:              return "growth"
    if "scale" in s:               return "scale"
    return s

def days_until_deadline(deadline_str):
    try:
        deadline = datetime.strptime(deadline_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return (deadline - datetime.now(timezone.utc)).days
    except:
        return 999

def deadline_label(days):
    if days < 0:    return None
    if days <= 7:   return ("⚠️ Closes this week", "#dc2626")
    if days <= 30:  return ("🔥 Closing soon",     "#d97706")
    if days <= 60:  return ("📅 Approaching",       "#2563eb")
    return None

def hard_filter_score(profile, source):
    """
    Weighted scoring used as a hard filter gate.
    Returns (pct, reasons). Funds below threshold are eliminated.
    """
    c = source["criteria"]
    w = source.get("weights", {
        "gender": 20, "ethnicity": 20, "location": 15,
        "stage": 15, "sector": 15, "identity_bonus": 10, "revenue": 5
    })

    gender    = profile.get("gender", "").lower()
    ethnicity = profile.get("ethnicity", "").lower()
    location  = profile.get("location", "").lower()
    stage     = normalize_stage(profile.get("stage", ""))
    sector    = profile.get("sector", "").lower()
    revenue   = profile.get("revenue", 0)

    score   = 0
    reasons = []
    max_score = sum(w.values())

    # Gender
    genders = [g.lower() for g in c.get("gender", ["any"])]
    if "any" in genders or gender in genders:
        score += w["gender"]
        if gender in genders and "any" not in genders:
            reasons.append(f"For {gender} founders")

    # Ethnicity
    # Ethnicity — expanded synonym matching
    ethnicity_synonyms = {
        "indian": ["south asian", "asian", "indian"],
        "desi": ["south asian", "asian", "indian", "pakistani"],
        "chinese": ["asian", "east asian", "chinese"],
        "korean": ["asian", "east asian", "korean"],
        "japanese": ["asian", "east asian", "japanese"],
        "vietnamese": ["asian", "southeast asian", "vietnamese"],
        "filipino": ["asian", "southeast asian", "filipino"],
        "black": ["black", "african american"],
        "african american": ["black", "african american"],
        "african": ["black", "african american"],
        "latina": ["latina", "hispanic", "latino"],
        "latino": ["latina", "hispanic", "latino"],
        "hispanic": ["latina", "hispanic", "latino"],
        "mexican": ["latina", "hispanic", "latino"],
        "native american": ["native american", "indigenous", "tribal"],
        "indigenous": ["native american", "indigenous", "tribal"],
        "middle eastern": ["middle eastern", "arab"],
        "arab": ["middle eastern", "arab"],
    }

    # Expand the input ethnicity using synonyms
    expanded_ethnicity = set([ethnicity])
    for key, synonyms in ethnicity_synonyms.items():
        if key in ethnicity:
            expanded_ethnicity.update(synonyms)

    ethnicities = [e.lower() for e in c.get("ethnicity", ["any"])]
    if "any" in ethnicities or any(
            e in eth for e in ethnicities for eth in expanded_ethnicity
    ):
        score += w["ethnicity"]
        if "any" not in ethnicities:
            reasons.append(f"Targets {profile.get('ethnicity')} entrepreneurs")

    # Location
    locations = [l.lower() for l in c.get("location", ["usa"])]
    if "usa" in locations or any(l in location for l in locations):
        score += w["location"]
        if not (len(locations) == 1 and "usa" in locations):
            reasons.append(f"Regional: {profile.get('location')}")

    # Stage
    stages = [s.lower() for s in c.get("stage", ["any"])]
    if "any" in stages or stage in stages:
        score += w["stage"]
        reasons.append(f"Fits {stage} stage")

    # Sector
    sectors = [s.lower() for s in c.get("sector", ["any"])]
    if "any" in sectors or any(s in sector for s in sectors):
        score += w["sector"]
        if "any" not in sectors:
            reasons.append(f"Sector focus: {profile.get('sector')}")

    # Revenue
    if revenue <= c.get("revenue_max", 99999999):
        score += w["revenue"]

    # Identity bonuses
    identity_max = w["identity_bonus"]
    if profile.get("is_parent")   and c.get("parent_friendly"):
        score += identity_max; reasons.append("Parent / caregiver friendly")
    elif profile.get("is_veteran") and c.get("veteran_friendly"):
        score += identity_max; reasons.append("Veteran entrepreneur program")
    elif profile.get("is_immigrant") and c.get("immigrant_friendly"):
        score += identity_max; reasons.append("Supports immigrant founders")
    elif profile.get("is_disabled") and c.get("disability_friendly"):
        score += identity_max; reasons.append("Disability entrepreneur program")
    elif profile.get("is_lgbtq")   and c.get("lgbtq_friendly"):
        score += identity_max; reasons.append("LGBTQ+ founder program")

    pct = round((score / max_score) * 100) if max_score > 0 else 0

    if not reasons:
        reasons.append("General eligibility match")

    return pct, reasons

def build_founder_text(profile):
    """
    Build a rich text representation of the founder for embedding.
    The richer this is, the better the semantic matching.
    """
    parts = [
        f"{profile.get('name', 'Founder')} is a {profile.get('gender', '')} entrepreneur",
        f"based in {profile.get('location', '')}",
        f"of {profile.get('ethnicity', '')} background",
        f"building a {profile.get('sector', '')} company",
        f"at the {profile.get('stage', '')} stage",
        f"using a {profile.get('business_model', '')} model",
    ]
    if profile.get("description"):
        parts.append(profile["description"])
    if profile.get("problem_solved"):
        parts.append(f"Solving: {profile['problem_solved']}")
    if profile.get("target_market"):
        parts.append(f"Serving: {profile['target_market']}")
    if profile.get("use_of_funds"):
        parts.append(f"Funding will be used for: {profile['use_of_funds']}")
    if profile.get("is_parent"):
        parts.append("single parent and caregiver")
    if profile.get("is_veteran"):
        parts.append("military veteran")
    if profile.get("is_immigrant"):
        parts.append("immigrant founder")

    return ". ".join(p for p in parts if p.strip())

def match_funding(profile):
    # Step 1 — Hard filter using weighted scoring
    filtered = []
    for i, source in enumerate(FUNDING_SOURCES):
        days = days_until_deadline(source.get("deadline", "2099-12-31"))
        if days < 0:
            continue
        pct, reasons = hard_filter_score(profile, source)
        if pct >= 35:
            filtered.append((i, source, pct, reasons, days))

    if not filtered:
        return []

    # Step 2 — Embed founder profile
    founder_text = build_founder_text(profile)
    founder_embedding = embedder.encode([founder_text], convert_to_numpy=True)

    # Step 3 — Cosine similarity against pre-computed fund embeddings
    fund_indices = [item[0] for item in filtered]
    filtered_fund_embeddings = FUND_EMBEDDINGS[fund_indices]
    similarities = cosine_similarity(founder_embedding, filtered_fund_embeddings)[0]

    # Step 4 — Combine: 60% cosine similarity + 40% weighted score
    results = []
    for idx, (fund_idx, source, weight_pct, reasons, days) in enumerate(filtered):
        cosine_pct  = float(similarities[idx]) * 100
        final_score = round(0.6 * cosine_pct + 0.4 * weight_pct)
        final_score = min(final_score, 99)  # cap at 99 — nothing is a perfect match

        entry = {
            **source,
            "score":         final_score,
            "cosine_score":  round(cosine_pct),
            "filter_score":  weight_pct,
            "match_reasons": reasons,
            "days_until_deadline": days
        }

        label = deadline_label(days)
        if label:
            entry["deadline_urgency"]       = label[0]
            entry["deadline_urgency_color"] = label[1]

        results.append(entry)

    # Step 5 — Sort by final combined score
    results.sort(key=lambda x: x["score"], reverse=True)

    if results:
        results[0]["is_best_match"] = True

    return results[:10]

def generate_draft(profile, fund_name, fund_description):
    identity_parts = []
    if profile.get("gender") == "woman": identity_parts.append("woman")
    if profile.get("ethnicity"):         identity_parts.append(profile["ethnicity"])
    if profile.get("is_parent"):         identity_parts.append("parent")
    if profile.get("is_veteran"):        identity_parts.append("veteran")
    if profile.get("is_immigrant"):      identity_parts.append("immigrant")
    identity_str = ", ".join(identity_parts) if identity_parts else "entrepreneur"

    prompt = f"""You are helping a startup founder write a compelling funding application intro.

Founder profile:
- Name: {profile.get('name')}
- Identity: {identity_str}
- Location: {profile.get('location')}
- Sector: {profile.get('sector')}
- Stage: {profile.get('stage')}
- Business model: {profile.get('business_model')}
- Team size: {profile.get('team_size')}
- Annual Revenue: ${profile.get('revenue', 0):,}
- Funding Needed: ${profile.get('funding_needed', 0):,}
- Use of funds: {profile.get('use_of_funds')}
- Business: {profile.get('description')}
- Problem solved: {profile.get('problem_solved')}
- Target market: {profile.get('target_market')}

Applying to: {fund_name}
Fund description: {fund_description}

Write 2-3 sentences that:
1. Connect directly to this fund's mission and criteria
2. Highlight the founder's most relevant identity and background
3. State specifically what the funding will achieve

Return only the paragraph. No preamble."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text