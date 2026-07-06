import os
import joblib
import pandas as pd
from fastapi import FastAPI, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from jose import jwt, JWTError
from dotenv import load_dotenv

# ==================================================
# CONFIG
# ==================================================
load_dotenv()

MODEL_PATH    = os.getenv("MODEL_PATH", "best_model_RandomForest.pkl")
JWT_SECRET    = os.getenv("JWT_SECRET", "your-secret-key-change-me")
JWT_ALGORITHM = "HS256"

# ==================================================
# LOAD MODEL
# ==================================================
try:
    model = joblib.load(MODEL_PATH)
    print("✅ Modèle chargé avec succès")
except Exception as e:
    print(f"⚠️ Erreur chargement modèle : {e}")
    model = None

# Colonnes exactes attendues par le modèle entraîné
if model is not None and hasattr(model, "feature_names_in_"):
    COLUMNS_TRAINING = list(model.feature_names_in_)
else:
    COLUMNS_TRAINING = []

print("📌 Colonnes modèle :", COLUMNS_TRAINING)

# ==================================================
# FASTAPI
# ==================================================
app = FastAPI(title="Task Duration Estimator", version="3.0")

security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# INPUT SCHEMA — Enrichi avec données historiques membres
# ==================================================
class TaskInput(BaseModel):
    # ── Champs task (obligatoires, identiques à l'ancien schema) ──────────────
    type:                    str  = Field(...,  example="Bug")
    priority:                str  = Field(...,  example="High")
    storyPoints:             int  = Field(...,  example=13)
    complexityScore:         int  = Field(...,  example=4)
    riskLevel:               int  = Field(...,  example=3)
    hasBlockingDependencies: bool = Field(...,  example=True)
    dependenciesCount:       int  = Field(...,  example=2)
    memberLevel:             str  = Field(...,  example="Expert")

    # ── Nouvelles features historiques (optionnelles pour rétrocompatibilité) ─
    memberAvgCompletionHours:  Optional[float] = Field(None, example=12.5)
    memberAvgDelayHours:       Optional[float] = Field(None, example=2.0)
    memberCompletedTasksCount: Optional[int]   = Field(None, example=42)
    memberAvgReopenRate:       Optional[float] = Field(None, example=0.05)
    memberCurrentWorkload:     Optional[int]   = Field(None, example=3)
    memberAvgWorkLogHours:     Optional[float] = Field(None, example=10.0)
    memberAvgStoryPoints:      Optional[float] = Field(None, example=4.2)


# ==================================================
# JWT OPTIONAL
# ==================================================
def verify_jwt_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        return {"sub": "anonymous"}
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return {"sub": "anonymous"}


# ==================================================
# MAIN ROUTE
# ==================================================
@app.post("/predict-hours")
def predict_hours(
    task: TaskInput,
    token: dict = Depends(verify_jwt_optional)
):
    try:
        if model is None:
            return {
                "estimated_hours": 8.0,
                "warning": "Model missing — using default fallback"
            }

        # ----------------------------
        # Build base dataframe
        # ----------------------------
        row = {
            "storyPoints":             task.storyPoints,
            "complexityScore":         task.complexityScore,
            "riskLevel":               task.riskLevel,
            "hasBlockingDependencies": int(task.hasBlockingDependencies),
            "dependenciesCount":       task.dependenciesCount,
        }

        # ── Nouvelles features historiques (0 si absentes → fallback neutre) ──
        row["memberAvgCompletionHours"]  = task.memberAvgCompletionHours  if task.memberAvgCompletionHours  is not None else 0.0
        row["memberAvgDelayHours"]       = task.memberAvgDelayHours       if task.memberAvgDelayHours       is not None else 0.0
        row["memberCompletedTasksCount"] = task.memberCompletedTasksCount if task.memberCompletedTasksCount is not None else 0
        row["memberAvgReopenRate"]       = task.memberAvgReopenRate       if task.memberAvgReopenRate       is not None else 0.0
        row["memberCurrentWorkload"]     = task.memberCurrentWorkload      if task.memberCurrentWorkload      is not None else 0
        row["memberAvgWorkLogHours"]     = task.memberAvgWorkLogHours      if task.memberAvgWorkLogHours      is not None else 0.0
        row["memberAvgStoryPoints"]      = task.memberAvgStoryPoints       if task.memberAvgStoryPoints       is not None else 0.0

        df = pd.DataFrame([row])

        # ----------------------------
        # MAPPING catégories → One-Hot
        # ----------------------------
        type_mapping = {
            "feature": "Feature", "bug": "Bug", "improvement": "Improvement",
            "spike": "Spike", "technical debt": "Technical Debt",
            "task": "Feature", "story": "Feature", "chore": "Feature",
            "research": "Feature", "support": "Feature"
        }
        priority_mapping = {
            "low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"
        }
        member_mapping = {
            "junior": "Junior", "beginner": "Junior",
            "senior": "Senior", "mid": "Senior",
            "expert": "Expert", "lead": "Expert"
        }

        mapped_type   = type_mapping.get(task.type.lower(), "Feature")
        mapped_prio   = priority_mapping.get(task.priority.lower(), "Medium")
        mapped_level  = member_mapping.get(task.memberLevel.lower(), "Junior")

        # One-Hot Encoding manuel (identique au script d'entraînement)
        for t in ["Bug", "Feature", "Improvement", "Spike", "Technical Debt"]:
            df[f"type_{t}"] = int(mapped_type == t)

        for p in ["Critical", "High", "Low", "Medium"]:
            df[f"priority_{p}"] = int(mapped_prio == p)

        for m in ["Expert", "Junior", "Senior"]:
            df[f"memberLevel_{m}"] = int(mapped_level == m)

        # ----------------------------
        # Ajouter les colonnes manquantes (rétrocompatibilité ancien modèle)
        # ----------------------------
        for col in COLUMNS_TRAINING:
            if col not in df.columns:
                df[col] = 0

        # ----------------------------
        # Ordonner les colonnes comme lors de l'entraînement
        # ----------------------------
        df_final = df[COLUMNS_TRAINING]

        # ----------------------------
        # Prédiction
        # ----------------------------
        prediction      = model.predict(df_final)
        estimated_hours = float(prediction[0])

        # Indique si les données historiques ont été utilisées
        history_used = task.memberAvgCompletionHours is not None

        return {
            "estimated_hours":       round(estimated_hours, 2),
            "unit":                  "hours",
            "requested_by":          token.get("sub", "anonymous"),
            "memberLevel_used":      mapped_level,
            "history_data_used":     history_used,
            "features_count":        len(COLUMNS_TRAINING),
        }

    except Exception as e:
        return {
            "estimated_hours": 8.0,
            "fallback":        True,
            "error":           str(e)
        }


# ==================================================
# HEALTH
# ==================================================
@app.get("/health")
def health():
    return {
        "status":         "online",
        "model":          "loaded" if model else "missing",
        "version":        "3.0",
        "columns_count":  len(COLUMNS_TRAINING),
        "columns":        COLUMNS_TRAINING,
    }


# ==================================================
# MAIN
# ==================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
