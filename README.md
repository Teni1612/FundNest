\# FundNest 🪺

> The Kayak of startup funding — find every grant, VC fund, accelerator, and government program that fits your profile, in seconds.



!\[Python](https://img.shields.io/badge/Python-3.11-blue)

!\[FastAPI](https://img.shields.io/badge/FastAPI-0.100-green)

!\[React](https://img.shields.io/badge/React-19-blue)

!\[Claude](https://img.shields.io/badge/Claude-Sonnet-purple)

!\[License](https://img.shields.io/badge/License-MIT-yellow)



\---



\## The Problem



A Latina single mother in Texas is building an EdTech company. She has $80K in revenue and needs $200K to grow. Right now, there are 35+ funding sources that are a perfect fit for her — grants for Latina entrepreneurs, VC funds mandated to invest in women-led EdTech, Texas-specific foundations, government programs she qualifies for but has never heard of.



She finds two by Googling. She spends 60 hours applying. The other 33 pass her by.



\*\*The problem was never the funding. It was the discovery.\*\*



\---



\## What FundNest Does



FundNest collects a founder's full profile across four steps and runs it through a two-stage hybrid matching engine against a curated database of funding sources — returning ranked matches with match scores, eligibility explanations, deadlines, and AI-generated application drafts.



\---



\## Features



\- \*\*4-step founder intake form\*\* — personal info, identity, business details, funding needs

\- \*\*Jargon explainers\*\* — tooltip + YouTube explainer on technical fields (entity type, business model, startup stage)

\- \*\*Two-stage hybrid matching engine\*\* — weighted attribute scoring as a hard filter, cosine similarity for semantic ranking

\- \*\*Ranked results\*\* — match %, eligibility reasons, deadline urgency badges, best match label

\- \*\*AI application drafts\*\* — Claude generates a personalized 2–3 sentence application intro for any matched fund

\- \*\*Save \& Track\*\* — bookmark funds, track status (Saved → Applied → Rejected → Funded), pipeline summary stats

\- \*\*40+ curated funding sources\*\* — grants, VC funds, government programs, accelerators across demographics, locations, and sectors



\---



\## How the Matching Engine Works



\### Stage 1 — Weighted Attribute Scoring (Hard Filter)



Each funding source has its own weight vector across seven dimensions. Funds scoring below 35% are eliminated.



| Criterion | Purpose |

|---|---|

| Gender | Matches gender-specific funds |

| Ethnicity | Surfaces niche demographic funds |

| Location | Prioritizes regional opportunities |

| Stage | Filters by startup maturity |

| Sector | Matches industry-specific funds |

| Identity bonus | Veteran, parent, immigrant, LGBTQ+, disability |

| Revenue ceiling | Ensures eligibility |



Weights are \*\*per-fund\*\* — a fund targeting Latina entrepreneurs weights ethnicity at 35+, while a general women's grant weights gender at 30 and ethnicity at 0.



\### Stage 2 — Cosine Similarity Ranking (Semantic)



Funds that pass the hard filter are re-ranked semantically:



1\. The founder's full profile (description, problem, target market, use of funds, identity) is converted to a \*\*384-dimension vector\*\* using `all-MiniLM-L6-v2`

2\. Fund descriptions are \*\*pre-computed at startup\*\* for fast queries

3\. Cosine similarity ranks eligible funds by semantic fit

4\. \*\*Final score = 60% cosine similarity + 40% weighted score\*\*



This means a Latina EdTech founder gets `digitalundivided FOCUS Fellowship` ranked #1 — not because of keyword matching, but because \*"Latina women building tech with social impact"\* is semantically closest to \*"helping Latina students access STEM education."\*



\---



\## Tech Stack



| Layer | Technology |

|---|---|

| Frontend | React 19, Vite, Axios |

| Backend | Python, FastAPI, Pydantic |

| Embedding model | `sentence-transformers` (all-MiniLM-L6-v2) |

| Similarity | `scikit-learn` cosine similarity |

| AI drafting | Anthropic Claude API (claude-sonnet-4-20250514) |

| Data | JSON-based curated funding database |

| Storage | Browser localStorage |



\---



\## Getting Started



\### Prerequisites

\- Python 3.11+

\- Node.js 18+

\- Anthropic API key



\### Backend



```bash

cd backend

python -m venv venv

venv\\Scripts\\activate        # Windows

source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

```



Create a `.env` file in the `backend/` folder:

```

ANTHROPIC\_API\_KEY=your\_key\_here

```



Start the backend:

```bash

uvicorn main:app --port 8000

```



The first startup takes \~15 seconds while the embedding model loads and pre-computes fund vectors.



\### Frontend



```bash

cd frontend

npm install

npm run dev

```



Open `http://localhost:5173`



\---



\## Project Structure



```

fundnest/

├── backend/

│   ├── main.py               # FastAPI app + endpoints

│   ├── matcher.py            # Two-stage hybrid matching engine

│   ├── requirements.txt

│   ├── .env.example

│   └── data/

│       └── funding\_sources.json   # Curated funding database

└── frontend/

&#x20;   └── src/

&#x20;       ├── App.jsx

&#x20;       ├── FounderForm.jsx   # 4-step intake form

&#x20;       └── Results.jsx       # Matched results + save \& track

```



\---



\## Funding Database Coverage



| Demographic | Example funds |

|---|---|

| Latina / Hispanic | Latinx VC Fund, LATINA Style, digitalundivided |

| Black / African American | Fearless Strivers, National Black MBA, Echoing Green |

| Asian / South Asian | Gold House Ventures, Asian Women Giving Circle, South Asian Bar Association |

| Veteran | V-WISE, Hivers and Strivers |

| Immigrant | Immigrant Entrepreneur Lab, New American Economy |

| LGBTQ+ | StartOut Growth Lab |

| Parent / Single mother | Grameen America, Motherhood \& Entrepreneurship Fund |

| Texas | Texas Women's Foundation |

| New York | New York Women's Foundation |

| California | California Women's Business Center, Asian Pacific Fund |

| Boston | Boston Women's Workforce Council |



\---



\## Roadmap



\- \[ ] PostgreSQL database replacing JSON

\- \[ ] Live data pipeline from grants.gov API

\- \[ ] User accounts and persistent profiles

\- \[ ] ChromaDB as persistent vector store

\- \[ ] Semantic natural language search

\- \[ ] Full application generation beyond intro drafts

\- \[ ] Email deadline reminders

\- \[ ] Public deployment



\---



\## Built At



SHEHack '26 — Khoury SHEROS of Color × NU Boston ACM-W Chapter



\---



\## License



MIT

