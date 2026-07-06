from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd
import joblib
import os

# =========================================
# CONFIG
# =========================================

MODEL_PATH = "best_pipeline_xgb.joblib"

# =========================================
# FASTAPI
# =========================================

app = FastAPI(title="Marketing Budget Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# LOAD MODEL
# =========================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

pipeline = joblib.load(MODEL_PATH)

print("Model loaded successfully")

# =========================================
# INPUT SCHEMA
# =========================================

class PredictInput(BaseModel):
    data: Dict[str, Any]

# =========================================
# NORMALIZATION
# =========================================

def normalize_multilabel(value):

    if value is None:
        return ""

    value = (
        str(value)
        .replace(";", "|")
        .replace(",", "|")
        .replace("/", "|")
    )

    parts = [
        p.strip().lower()
        for p in value.split("|")
        if p.strip()
    ]

    return "|".join(sorted(set(parts)))

# =========================================
# ROUTES
# =========================================

@app.get("/")
def home():
    return {"message": "API Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

# =========================================
# PREDICT
# =========================================

@app.post("/predict")
def predict(input_data: PredictInput):

    try:

        data = input_data.data

        # DataFrame
        df = pd.DataFrame([data])

        # =========================
        # NORMALIZE MULTILABELS
        # =========================

        multilabel_cols = [
            "channels",
            "keyDeliverables",
            "metrics"
        ]

        for col in multilabel_cols:

            if col in df.columns:
                df[col] = df[col].apply(normalize_multilabel)

        # =========================
        # PREDICTION
        # =========================

        prediction = pipeline.predict(df)[0]

        print("RAW PREDICTION =", prediction)

        return {
        "predictedBudget": float(prediction)
         }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )