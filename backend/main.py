from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from matcher import match_funding, generate_draft
from typing import Optional, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FounderProfile(BaseModel):
    # Step 1
    name: str
    email: Optional[str] = ""
    location: str
    entity_type: Optional[str] = ""
    years_in_business: Optional[str] = ""
    # Step 2
    gender: str
    ethnicity: str
    is_parent: Optional[bool] = False
    is_veteran: Optional[bool] = False
    is_immigrant: Optional[bool] = False
    is_disabled: Optional[bool] = False
    is_lgbtq: Optional[bool] = False
    # Step 3
    sector: str
    stage: str
    business_model: Optional[str] = ""
    team_size: Optional[str] = ""
    revenue: int
    description: str
    problem_solved: Optional[str] = ""
    target_market: Optional[str] = ""
    # Step 4
    funding_needed: int
    funding_types: Optional[List[str]] = []
    timeline: Optional[str] = ""
    prior_funding: Optional[str] = ""
    use_of_funds: Optional[str] = ""

class DraftRequest(BaseModel):
    profile: FounderProfile
    fund_name: str
    fund_description: str

@app.post("/match")
def match(profile: FounderProfile):
    return {"matches": match_funding(profile.dict())}

@app.post("/draft")
def draft(req: DraftRequest):
    text = generate_draft(req.profile.dict(), req.fund_name, req.fund_description)
    return {"draft": text}

@app.get("/health")
def health():
    return {"status": "ok"}