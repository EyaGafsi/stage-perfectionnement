from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd
import numpy as np
import joblib
import os

# =====================================
# CONFIG
# =====================================

MODEL_PATH = "./best_duration_model.joblib"
MLB_PATH   = "./mlb_channels.joblib"

# =====================================
# APP
# =====================================

app = FastAPI(title="Marketing Duration Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# LOAD MODEL + MLB
# =====================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

if not os.path.exists(MLB_PATH):
    raise FileNotFoundError(f"MLB not found: {MLB_PATH}")

model = joblib.load(MODEL_PATH)
mlb   = joblib.load(MLB_PATH)

print("Model loaded successfully")
print(f"MLB classes: {mlb.classes_}")

# =====================================
# INPUT SCHEMA
# =====================================

class PredictInput(BaseModel):
    data: Dict[str, Any]

# =====================================
# ROUTES
# =====================================

@app.get("/")
def home():
    return {"message": "API Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

# =====================================
# PREDICT
# =====================================

@app.post("/predict")
def predict(input_data: PredictInput):
    try:
        d = input_data.data

        print(
            f"[predict] task_type={d.get('task_type')} "
            f"status={d.get('status')} "
            f"priority={d.get('priority')} "
            f"channel_group={d.get('channel_group')}"
        )

        # =====================================================
        # MAPPING : frontend keys → colonnes d'entraînement
        # Le modèle a été entraîné sur ces colonnes exactes
        # =====================================================

        # Colonnes catégorielles (OneHotEncoded par le pipeline)
        task_type     = str(d.get('task_type',     'OTHER'))
        status        = str(d.get('status',        'TO_DO'))
        priority      = str(d.get('priority',      'MEDIUM'))
        channel_group = str(d.get('channel_group', 'Social'))

        # Colonnes numériques
        cost        = float(d.get('cost',        0) or 0)
        impressions = float(d.get('impressions', 0) or 0)
        clicks      = float(d.get('clicks',      0) or 0)
        conversions = float(d.get('conversions', 0) or 0)
        leads       = float(d.get('leads',       0) or 0)
        score       = float(d.get('score',       3) or 3)
        ctr         = float(d.get('ctr',         0) or 0)
        complexity  = float(d.get('complexity',  3) or 3)
        effort      = float(d.get('effort',      2) or 2)
        unused1     = float(d.get('unused1',     0) or 0)
        flag        = float(d.get('flag',        0) or 0)
        id_val      = float(d.get('id',          0) or 0)

        # =====================================================
        # Channels → one-hot via mlb
        # =====================================================

        channels_str  = str(d.get('channels', '') or '')
        channels_list = [[s.strip() for s in channels_str.split(';') if s.strip()]]

        ch_matrix = mlb.transform(channels_list)
        ch_cols   = {f"ch_{c}": int(ch_matrix[0][i]) for i, c in enumerate(mlb.classes_)}

        # =====================================================
        # Construire le DataFrame avec l'ordre exact
        # =====================================================

        row = {
            'task_type':     task_type,
            'status':        status,
            'priority':      priority,
            'cost':          cost,
            'impressions':   impressions,
            'clicks':        clicks,
            'conversions':   conversions,
            'leads':         leads,
            'score':         score,
            'ctr':           ctr,
            'channel_group': channel_group,
            'complexity':    complexity,
            'effort':        effort,
            'unused1':       unused1,
            'flag':          flag,
            'id':            id_val,
            **ch_cols,
        }

        raw = pd.DataFrame([row])

        print(f"[predict] shape: {raw.shape}, colonnes: {raw.columns.tolist()}")

        # =====================================================
        # Prédiction
        # =====================================================

        prediction = model.predict(raw)

        if hasattr(prediction, 'ndim') and prediction.ndim > 1:
            prediction = prediction.ravel()

        # La target d'entraînement est actualDurationHours → déjà en heures
        result_hours = round(float(prediction[0]), 2)

        print(f"[predict] résultat: {result_hours:.2f}h")

        return {"prediction": result_hours}

    except Exception as e:
        print(f"[predict] erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))