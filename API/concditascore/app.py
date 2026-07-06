import os
import requests
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACE_HUB_TOKEN")

MODEL_URL = (
    "https://router.huggingface.co/"
    "hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2"
)

if not HF_TOKEN:
    raise RuntimeError("HUGGINGFACE_HUB_TOKEN not set")

app = FastAPI(title="CV Scoring API v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class CVData(BaseModel):
    experience_text: str = ""
    education_text: str = ""
    years_experience: float = 0
    years_education: float = 0
    skills: List[str] = []          # skills.all from parser
    technical_skills: List[str] = []
    level: str = "Junior"

class ScoreRequest(BaseModel):
    # Job info
    job_title: Optional[str] = None
    job_description: str
    job_experience_description: str = ""
    job_education_description: str = ""
    job_skills_description: str = ""
    job_required_skills: List[str] = []
    job_preferred_skills: List[str] = []
    job_keywords: List[str] = []
    job_required_level: str = "Junior"
    job_min_years_experience: float = 0
    job_min_years_education: float = 0

    # CV data (already parsed)
    cv: CVData

# ============================================
# HF SIMILARITY
# ============================================

def hf_similarity(sentence_a: str, sentence_b: str) -> float:
    if not sentence_a.strip() or not sentence_b.strip():
        return 0.0

    payload = {
        "inputs": {
            "source_sentence": sentence_a,
            "sentences": [sentence_b],
        }
    }
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    response = requests.post(MODEL_URL, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"HF API error: {response.text}")
    return float(response.json()[0])


# ============================================
# SCORING FUNCTIONS
# ============================================

def score_experience(job: ScoreRequest, cv: CVData) -> dict:
    """
    Score d'expérience (0-100) :
    - 50% sémantique : job_experience_description vs cv.experience_text
    - 50% années : comparaison years_experience vs min_years_experience
    """
    # Sémantique
    if job.job_experience_description and cv.experience_text:
        semantic = hf_similarity(job.job_experience_description, cv.experience_text)
    elif job.job_description and cv.experience_text:
        semantic = hf_similarity(job.job_description, cv.experience_text)
    else:
        semantic = 0.0

    # Années
    min_y = job.job_min_years_experience
    if min_y <= 0:
        years_score = 1.0
    else:
        years_score = min(cv.years_experience / min_y, 1.0)

    final = round((semantic * 0.5 + years_score * 0.5) * 100, 2)
    return {
        "score": final,
        "semantic_similarity": round(semantic, 4),
        "years_score": round(years_score * 100, 2),
        "cv_years": cv.years_experience,
        "required_years": min_y,
    }


def score_education(job: ScoreRequest, cv: CVData) -> dict:
    """
    Score de formation (0-100) :
    - 50% sémantique : job_education_description vs cv.education_text
    - 50% années
    """
    if job.job_education_description and cv.education_text:
        semantic = hf_similarity(job.job_education_description, cv.education_text)
    elif job.job_description and cv.education_text:
        semantic = hf_similarity(job.job_description, cv.education_text)
    else:
        semantic = 0.0

    min_y = job.job_min_years_education
    if min_y <= 0:
        years_score = 1.0
    else:
        years_score = min(cv.years_education / min_y, 1.0)

    final = round((semantic * 0.5 + years_score * 0.5) * 100, 2)
    return {
        "score": final,
        "semantic_similarity": round(semantic, 4),
        "years_score": round(years_score * 100, 2),
        "cv_years": cv.years_education,
        "required_years": min_y,
    }


def score_skills(job: ScoreRequest, cv: CVData) -> dict:
    """
    Score des compétences (0-100) :
    - 60% matching exact : required_skills ∩ cv.skills (normalisé)
    - 20% preferred skills matching
    - 20% sémantique : skills_description vs cv.skills joined
    """
    def normalize(s: str) -> str:
        return s.lower().strip()

    cv_skills_normalized = {normalize(s) for s in cv.skills}
    required_normalized = [normalize(s) for s in job.job_required_skills]
    preferred_normalized = [normalize(s) for s in job.job_preferred_skills]

    # Required skills match
    if required_normalized:
        matched_required = [s for s in required_normalized if s in cv_skills_normalized]
        required_ratio = len(matched_required) / len(required_normalized)
    else:
        matched_required = []
        required_ratio = 1.0  # pas de skills requis → score plein

    # Preferred skills match
    if preferred_normalized:
        matched_preferred = [s for s in preferred_normalized if s in cv_skills_normalized]
        preferred_ratio = len(matched_preferred) / len(preferred_normalized)
    else:
        matched_preferred = []
        preferred_ratio = 0.0

    # Sémantique skills
    cv_skills_text = " ".join(cv.skills) if cv.skills else ""
    job_skills_text = (
        job.job_skills_description
        or " ".join(job.job_required_skills + job.job_preferred_skills)
        or job.job_description
    )
    if job_skills_text and cv_skills_text:
        semantic = hf_similarity(job_skills_text, cv_skills_text)
    else:
        semantic = 0.0

    final = round((required_ratio * 0.6 + preferred_ratio * 0.2 + semantic * 0.2) * 100, 2)

    return {
        "score": final,
        "required_matched": matched_required,
        "required_total": len(required_normalized),
        "required_ratio": round(required_ratio * 100, 2),
        "preferred_matched": matched_preferred,
        "preferred_total": len(preferred_normalized),
        "preferred_ratio": round(preferred_ratio * 100, 2),
        "semantic_similarity": round(semantic, 4),
        "cv_skills": cv.skills,
    }


def score_level(job: ScoreRequest, cv: CVData) -> dict:
    """
    Score de niveau (0-100) basé sur la correspondance Junior/Intermédiaire/Senior
    """
    level_order = {"Junior": 1, "Intermédiaire": 2, "Senior/Expert": 3}
    required = level_order.get(job.job_required_level, 1)
    candidate = level_order.get(cv.level, 1)

    if candidate >= required:
        score = 100.0
    elif candidate == required - 1:
        score = 60.0
    else:
        score = 20.0

    return {
        "score": score,
        "required_level": job.job_required_level,
        "candidate_level": cv.level,
    }


def score_global(job: ScoreRequest, cv: CVData) -> dict:
    """
    Score global sémantique : job_description vs cv experience + education
    """
    cv_full = f"{cv.experience_text} {cv.education_text} {' '.join(cv.skills)}"
    if job.job_description and cv_full.strip():
        semantic = hf_similarity(job.job_description, cv_full)
    else:
        semantic = 0.0
    return {
        "score": round(semantic * 100, 2),
        "semantic_similarity": round(semantic, 4),
    }


# ============================================
# MAIN SCORE ROUTE
# ============================================

@app.post("/score")
async def score(data: ScoreRequest):
    try:
        exp_result = score_experience(data, data.cv)
        edu_result = score_education(data, data.cv)
        skills_result = score_skills(data, data.cv)
        level_result = score_level(data, data.cv)
        global_result = score_global(data, data.cv)

        # Pondération finale
        # expérience 35% | éducation 20% | skills 30% | niveau 15%
        def clamp(v): return round(max(0.0, min(100.0, v)), 2)

        # Clamp tous les scores individuels
        exp_result["score"]    = clamp(exp_result["score"])
        edu_result["score"]    = clamp(edu_result["score"])
        skills_result["score"] = clamp(skills_result["score"])
        level_result["score"]  = clamp(level_result["score"])

        final_score = clamp(
            exp_result["score"] * 0.35
            + edu_result["score"] * 0.20
            + skills_result["score"] * 0.30
            + level_result["score"] * 0.15
        )

        return {
            "job_title": data.job_title,
            "final_score": final_score,
            "breakdown": {
                "experience": exp_result,
                "education": edu_result,
                "skills": skills_result,
                "level": level_result,
                "global_semantic": global_result,
            },
            "weights": {
                "experience": "35%",
                "education": "20%",
                "skills": "30%",
                "level": "15%",
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Legacy route — garde la compatibilité avec l'ancien front
@app.post("/score/legacy")
async def score_legacy(data: dict):
    try:
        job_text = data.get("job_text", "")
        cv_text = data.get("cv_text", "")
        keywords = data.get("job_keywords", [])

        job_full = job_text
        if keywords:
            job_full += " Keywords: " + ", ".join(keywords)

        semantic = hf_similarity(job_full, cv_text)
        return {
            "job_title": data.get("job_title"),
            "semantic_similarity": round(semantic, 4),
            "final_score_percent": round(semantic * 100, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0"}