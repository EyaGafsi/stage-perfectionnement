from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gradio_client import Client

app = FastAPI(title="Industry Prediction API")

# Autoriser ton frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Client("Traii/predict-industry-api")

class ServiceRequest(BaseModel):
    service: str

@app.post("/predict-service")
def predict_service(data: ServiceRequest):
    try:
        result = client.predict(
            service=data.service,
            api_name="/predict_service"
        )
        return {
            "success": True,
            "input": data.service,
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
