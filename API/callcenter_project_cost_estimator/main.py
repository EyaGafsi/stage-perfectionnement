from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
from fastapi.middleware.cors import CORSMiddleware

# Charger le modèle
pipeline = joblib.load("./call_center_project_cost_model_pipeline.joblib")

app = FastAPI(
    title="Call Center Cost Prediction API",
    version="1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # ou ["https://ton-domaine.com"] en prod
    allow_credentials=True,
    allow_methods=["*"],        # autorise OPTIONS, POST, GET...
    allow_headers=["*"],
)
# Colonnes attendues
EXPECTED_COLS = [
    '0','1','2','3','4','5','8','9',
    '6__Sales','6__Support','6__Tech','6__callTypes',
    '7__AI','7__CRM','7__CTI','7__IVR',
    '7__Training','7__WFM','7__dependencies'
]

# ----------------------------
# Request Body
# ----------------------------
class PredictionRequest(BaseModel):
    numberOfAgents: int
    numberOfCallsPerDay: int
    averageHandleTimeSec: float
    estimatedDurationDays: int
    slaTargetSeconds: int
    risksScore: float
    callTypes: str
    dependencies: str
    CSAT: float
    FCR: float

# ----------------------------
# Multi-label Expansion
# ----------------------------
def expand_project(data, sep=';'):

    calltypes = str(data.callTypes).split(sep)
    calltypes = [x.strip() for x in calltypes]

    deps = str(data.dependencies).split(sep)
    deps = [x.strip() for x in deps]

    row = {
        '0': data.numberOfAgents,
        '1': data.numberOfCallsPerDay,
        '2': data.averageHandleTimeSec,
        '3': data.estimatedDurationDays,
        '4': data.slaTargetSeconds,
        '5': data.risksScore,
        '8': data.CSAT,
        '9': data.FCR,
    }

    # callTypes
    for lab in ['6__Sales','6__Support','6__Tech','6__callTypes']:
        label = lab.split('__')[1]
        row[lab] = 1 if label in calltypes else 0

    # dependencies
    for lab in [
        '7__AI','7__CRM','7__CTI',
        '7__IVR','7__Training',
        '7__WFM','7__dependencies'
    ]:
        label = lab.split('__')[1]
        row[lab] = 1 if label in deps else 0

    return row

# ----------------------------
# Routes
# ----------------------------

@app.get("/")
def home():
    return {
        "message": "ML API is running"
    }

@app.post("/predict")
def predict(data: PredictionRequest):

    row = expand_project(data)

    df = pd.DataFrame([row], columns=EXPECTED_COLS)

    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors='coerce')

    prediction = pipeline.predict(df)[0]

    return {
        "predicted_budget_tnd": round(float(prediction), 2)
    }