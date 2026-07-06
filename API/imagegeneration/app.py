import os
import base64
import logging
import traceback
from io import BytesIO

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gradio_client import Client
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# =========================
# LOGGING
# =========================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# LOAD ENV
# =========================
load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("HF_TOKEN not found in .env file")

# =========================
# CONFIG
# =========================
SPACE_NAME = "amin1221/enrechirprompt"
IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell"

# =========================
# APP
# =========================
app = FastAPI(title="Prompt To Image API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# CLIENTS
# =========================
prompt_client = Client(SPACE_NAME)

image_client = InferenceClient(
    api_key=HF_TOKEN
)

# =========================
# REQUEST MODEL
# =========================
class ImageRequest(BaseModel):
    prompt: str
    mode: str  # simple / enriched

# =========================
# BASE64 HELPER
# =========================
def image_to_base64(image):
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

# =========================
# TEST ENDPOINT
# =========================
@app.get("/test-space")
def test_space():
    try:
        logger.info("Testing Space connection...")
        client = Client(SPACE_NAME)
        result = client.predict(
            "a cat",
            api_name="/predict_prompt"
        )
        logger.info(f"Space test success: {result}")
        return {"success": True, "result": result}
    except Exception as e:
        logger.error("=== SPACE TEST ERROR ===")
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}

# =========================
# MAIN ENDPOINT
# =========================
@app.post("/generate-image")
def generate_image(data: ImageRequest):
    try:
        final_prompt = data.prompt
        enriched_prompt = None

        # =====================
        # ENRICH PROMPT
        # =====================
        if data.mode.lower() == "enriched":
            logger.info(f"Enriching prompt: {data.prompt}")
            try:
                client = Client(SPACE_NAME)
                enriched_prompt = client.predict(
                    data.prompt,
                    api_name="/predict_prompt"
                )
                final_prompt = enriched_prompt
                logger.info(f"Enriched prompt: {enriched_prompt}")
            except Exception as enrich_error:
                logger.error("=== ENRICH ERROR ===")
                logger.error(traceback.format_exc())
                raise HTTPException(
                    status_code=500,
                    detail=f"Enrichment failed: {str(enrich_error)}"
                )

        # =====================
        # GENERATE IMAGE
        # =====================
        logger.info(f"Generating image with prompt: {final_prompt}")
        try:
            image = image_client.text_to_image(
                final_prompt,
                model=IMAGE_MODEL
            )
            logger.info("Image generated successfully")
        except Exception as image_error:
            logger.error("=== IMAGE GENERATION ERROR ===")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Image generation failed: {str(image_error)}"
            )

        # =====================
        # CONVERT TO BASE64
        # =====================
        image_base64 = image_to_base64(image)

        return {
            "success": True,
            "mode": data.mode,
            "original_prompt": data.prompt,
            "used_prompt": final_prompt,
            "enriched_prompt": enriched_prompt,
            "image_base64": image_base64
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("=== UNEXPECTED ERROR ===")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
