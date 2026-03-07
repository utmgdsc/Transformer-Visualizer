from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from models.model_loader import model_manager
from routes.inference import router as inference_router

from models.model_loader import model_manager, LANGUAGE_MODELS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # load model on startup
    model_manager.load_model(language="en", device=settings.device)
    yield
    # cleanup model on shutdown
    model_manager.models = {}

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register inference routes
app.include_router(inference_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_manager.is_loaded(),
        "model_name": LANGUAGE_MODELS[settings.default_language]
    }
