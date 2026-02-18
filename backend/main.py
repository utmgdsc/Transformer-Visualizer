from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from models.model_loader import model_manager
from routes.inference import router as inference_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # load model on startup
    model_manager.load_model(model_name=settings.model_name, device=settings.device)
    yield
    # cleanup model on shutdown
    model_manager.model = None

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
        "model_name": model_manager.model_name
    }
