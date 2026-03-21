from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from models.model_loader import model_manager, LANGUAGE_MODELS
from routes.inference import router as inference_router
from routes.attention import router as attention_router
from routes.ablation import router as ablation_router
from routes.qkv import router as qkv_router
from routes.mlp import router as mlp_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # load model on startup
    model_manager.load_model(language="en", device=settings.device)
    model_manager.load_model(language="fr", device=settings.device)
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
app.include_router(attention_router)
app.include_router(ablation_router)
app.include_router(qkv_router)
app.include_router(mlp_router)

@app.get("/health")
async def health_check():
    current_model = None
    if model_manager.curr_language and model_manager.curr_language in LANGUAGE_MODELS:
        current_model = LANGUAGE_MODELS[model_manager.curr_language]
    
    return {
        "status": "healthy",
        "model_loaded": model_manager.is_loaded(),
        "current_language": model_manager.curr_language,
        "current_model": current_model,
        "available_languages": list(LANGUAGE_MODELS.keys())
    }
    
@app.get("/")
async def home():
    return {
        "app": settings.app_name,
        "version": "v1"
    }
