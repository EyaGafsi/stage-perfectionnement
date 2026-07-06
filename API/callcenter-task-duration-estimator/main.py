from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware

MODEL_PATH = "./best_estimatedHours_task_callcenter_lgbm.joblib"

print("FILES:", os.listdir("."))

if not os.path.exists(MODEL_PATH):
    raise Exception(f"Model file not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

app = FastAPI(title="Estimated Hours API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskInput(BaseModel):
    type: str
    priority: str
    status: str
    complexityScore: int
    riskLevel: int
    targetAgentCount: int
    expectedCallsPerAgent: int
    targetConversionRate: float
    qualityScoreTarget: int
    dependenciesCount: int
    reopenCount: int
    delayHours: float

@app.get("/")
def home():
    return {"message": "API is running 🚀"}

@app.post("/predict")
def predict(data: TaskInput):
    df = pd.DataFrame([data.dict()])
    pred = model.predict(df)
    return {"estimatedHours": float(pred[0])}