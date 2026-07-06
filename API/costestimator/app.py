import os
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# =========================
# CONFIG
# =========================
MODEL_PATH = os.getenv("MODEL_PATH", "./best_project_cost_model.pkl")
ENCODERS_PATH = os.getenv("ENCODERS_PATH", "./encoders.pkl")

print("📁 MODEL:", MODEL_PATH)

# =========================
# LOAD MODEL
# =========================
try:
    model = joblib.load(MODEL_PATH)
    print("✅ RandomForest chargé")
except Exception as e:
    print("❌ Model error:", e)
    model = None

# load encoders
try:
    encoders = joblib.load(ENCODERS_PATH)
    print("✅ Encoders chargés")
except Exception as e:
    print("❌ Encoders error:", e)
    encoders = None


# =========================
# FASTAPI
# =========================
app = FastAPI(title="Smart Cost API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# INPUT
# =========================
class ProjectRequest(BaseModel):
    programmingLanguages: str
    framework: str
    database: str
    serverDetails: str
    architecture: str
    apiIntegration: str
    securityRequirements: str
    devOpsRequirements: str
    estimatedDurationDays: int
    priority: str
    businessImpact: str
    teamSize: int
    complexity: str
    mainModules: str


# =========================
# SAFE ENCODER
# =========================
def encode_input(df):
    for col in df.columns:

        if col not in encoders:
            continue

        le = encoders[col]
        values = []

        for val in df[col].astype(str):

            # gérer listes: Python C#
            tokens = val.split()

            encoded_tokens = []

            for token in tokens:
                if token in le.classes_:
                    encoded_tokens.append(le.transform([token])[0])

            # moyenne si plusieurs valeurs
            if len(encoded_tokens) > 0:
                values.append(sum(encoded_tokens) / len(encoded_tokens))
            else:
                values.append(-1)

        df[col] = values

    return df


# =========================
# PREDICT
# =========================
@app.post("/predict-cost")
def predict_cost(project: ProjectRequest):

    if model is None:
        return {"error": "Model not loaded"}

    try:
        feature_cols = [
            "programmingLanguages","framework","database","serverDetails",
            "architecture","apiIntegration","securityRequirements",
            "devOpsRequirements","estimatedDurationDays","priority",
            "businessImpact","teamSize","complexity","mainModules"
        ]

        df = pd.DataFrame([project.dict()])[feature_cols]

        if encoders is not None:
            df = encode_input(df)

        pred = model.predict(df)[0]
        pred = max(0, float(pred))

        return {
            "estimated_cost": round(pred, 2),
            "currency": "DT"
        }

    except Exception as e:
        return {"error": str(e)}


# =========================
# HEALTH
# =========================
@app.get("/health")
def health():
    return {
        "model": "loaded" if model else "missing",
        "encoders": "loaded" if encoders else "missing"
    }


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"message": "API online"}
