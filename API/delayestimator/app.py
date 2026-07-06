import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="Task Delay Estimator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RISK_MODEL_PATH = "models/delay_risk_model.pkl"
REASON_MODEL_PATH = "models/delay_reason_model.pkl"

if not os.path.exists(RISK_MODEL_PATH) or not os.path.exists(REASON_MODEL_PATH):
    raise RuntimeError("Models not found. Please run 'python retrain.py' first.")

risk_model = joblib.load(RISK_MODEL_PATH)
reason_model = joblib.load(REASON_MODEL_PATH)

class DelayPredictionRequest(BaseModel):
    # Task base features
    type: str = Field(default="FEATURE")
    priority: str = Field(default="MEDIUM")
    storyPoints: float = Field(default=1.0)
    complexityScore: int = Field(default=1)
    riskLevel: int = Field(default=1)
    hasBlockingDependencies: bool = Field(default=False)
    dependenciesCount: int = Field(default=0)
    
    # Member history stats (fallback to 0 or Junior if missing)
    memberLevel: str = Field(default="Junior")
    memberAvgCompletionHours: float = Field(default=0.0)
    memberAvgDelayHours: float = Field(default=0.0)
    memberCompletedTasksCount: int = Field(default=0)
    memberAvgReopenRate: float = Field(default=0.0)
    memberCurrentWorkload: int = Field(default=0)
    allocatedTimeHours: float = Field(default=40.0)
    predictedDurationHours: float = Field(default=40.0)
    pastFrequentDelayReason: str = Field(default="None")

@app.post("/predict-delay")
def predict_delay(req: DelayPredictionRequest):
    try:
        # Preprocess features into dictionary
        features = {
            'type': [req.type],
            'priority': [req.priority],
            'storyPoints': [req.storyPoints],
            'complexityScore': [req.complexityScore],
            'riskLevel': [req.riskLevel],
            'hasBlockingDependencies': [1 if req.hasBlockingDependencies else 0],
            'dependenciesCount': [req.dependenciesCount],
            'memberLevel': [req.memberLevel],
            'memberAvgCompletionHours': [req.memberAvgCompletionHours],
            'memberAvgDelayHours': [req.memberAvgDelayHours],
            'memberCompletedTasksCount': [req.memberCompletedTasksCount],
            'memberAvgReopenRate': [req.memberAvgReopenRate],
            'memberCurrentWorkload': [req.memberCurrentWorkload],
            'allocatedTimeHours': [req.allocatedTimeHours],
            'predictedDurationHours': [req.predictedDurationHours],
            'pastFrequentDelayReason': [req.pastFrequentDelayReason],
        }
        
        # Convert to DataFrame - the Scikit-Learn Pipeline will handle the OneHotEncoding and Scaling automatically!
        df_input = pd.DataFrame(features)
        
        # Predict Risk (0 or 1)
        # Using predict_proba to get actual risk percentage
        risk_proba = risk_model.predict_proba(df_input)[0]
        # risk_proba[1] is the probability of class 1 (Delayed)
        delay_prob = float(risk_proba[1])
        
        # Predict Reason
        # We predict a reason even if risk is low, to provide a "potential" reason
        predicted_reason = str(reason_model.predict(df_input)[0])
        
        return {
            "risk_probability": round(delay_prob, 2),
            "will_be_delayed": delay_prob > 0.5,
            "predicted_reason": predicted_reason if delay_prob > 0.15 else "Aucun retard estimé"
        }
    except Exception as e:
        print(f"Error predicting delay: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
