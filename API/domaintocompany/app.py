from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ddgs import DDGS
import re

app = FastAPI(title="Company Finder API")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# INPUT MODEL
# =========================
class RequestData(BaseModel):
    domain: str
    country: str
    max_results: int = 5


# =========================
# CLEANING FUNCTIONS
# =========================
BAD_WORDS = [
    "top", "list", "best", "guide", "ranking",
    "wikipedia", "news", "article", "definition",
    "companies in", "list of", "how to"
]

def is_bad_title(text: str) -> bool:
    low = text.lower()
    return any(b in low for b in BAD_WORDS)

def extract_name(title: str):
    if not title:
        return None

    # couper sur LinkedIn
    name = title.split("|")[0].split("-")[0].strip()

    # supprimer caractères spéciaux
    name = re.sub(r"[^\w\s&.,'-]", "", name).strip()

    # filtre longueur et junk
    if len(name) < 2 or is_bad_title(name):
        return None

    return name


# =========================
# SEARCH ENGINE
# =========================
def search_companies(query: str, limit: int):
    results = []

    with DDGS() as ddgs:
        data = ddgs.text(query, max_results=limit * 5)

        for r in data:
            url = r.get("href", "")
            title = r.get("title", "")

            # filtrer uniquement LinkedIn company pages
            if "linkedin.com/company" not in url.lower():
                continue

            name = extract_name(title)
            if name:
                results.append(name)

            if len(results) >= limit:
                break

    return results


# =========================
# API ROUTES
# =========================
@app.get("/")
def home():
    return {"message": "Company Finder API Running 🚀"}

@app.post("/find-companies")
def find_companies(data: RequestData):

    queries = [
        f"site:linkedin.com/company {data.domain} {data.country}",
        f"site:linkedin.com/company {data.domain} entreprises {data.country}",
        f"site:linkedin.com/company {data.domain} firms {data.country}",
        f"site:linkedin.com/company {data.country} {data.domain} companies"
    ]

    seen = set()
    final_results = []

    try:
        for q in queries:
            raw_results = search_companies(q, data.max_results)

            for company in raw_results:
                key = company.lower()

                if key not in seen:
                    seen.add(key)
                    final_results.append(company)

                if len(final_results) >= data.max_results:
                    break

            if len(final_results) >= data.max_results:
                break

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "domain": data.domain,
        "country": data.country,
        "results": final_results
    }
