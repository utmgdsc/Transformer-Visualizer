from fastapi import APIRouter, HTTPException
import torch
from models.model_loader import model_manager

router = APIRouter(prefix="/v1", tags=["modelinfo"])

@router.get("/model-info")
async def get_model_info(language: str = "en"):
    if not model_manager.is_loaded(language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(language)
    
    return {
        "language": language,
        "n_layers": model.cfg.n_layers,
        "n_heads": model.cfg.n_heads,
        "d_model": model.cfg.d_model,
        "n_vocab": model.cfg.d_vocab,
        "model_name": model.cfg.model_name
    }