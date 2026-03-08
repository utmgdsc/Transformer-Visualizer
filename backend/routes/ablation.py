"""
Ablation Routes: API endpoints for activation modification experiments.
"""

from fastapi import APIRouter, HTTPException

from models.model_loader import model_manager
from schemas import AblationRequest, AblationResponse
from services.ablation_service import generate_with_ablation

router = APIRouter(prefix="/v1", tags=["ablation"])


@router.post("/ablate", response_model=AblationResponse)
async def ablate_and_generate(request: AblationRequest):
    """
    Generate text with ablated attention heads or layers.
    
    Supports three ablation types:
    - zero: Set activations to zero
    - mean: Replace activations with their mean
    - scale: Scale activations by a factor
    
    Returns both ablated and baseline generations for comparison.
    """
    # validate ablation type
    valid_types = ["zero", "mean", "scale"]
    if request.ablation_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ablation_type. Must be one of: {valid_types}"
        )
    
    # check if model is loaded
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
    # validate layer/head indices
    if request.target_layer < 0 or request.target_layer >= model.cfg.n_layers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layer. Must be between 0 and {model.cfg.n_layers - 1}"
        )
    
    if request.target_head is not None:
        if request.target_head < 0 or request.target_head >= model.cfg.n_heads:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid head. Must be between 0 and {model.cfg.n_heads - 1}"
            )
    
    try:
        # perform ablation experiment using service layer
        ablated_text, baseline_text = generate_with_ablation(
            model=model,
            text=request.text,
            ablation_type=request.ablation_type,
            target_layer=request.target_layer,
            target_head=request.target_head,
            scale_factor=request.scale_factor,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        return AblationResponse(
            input_text=request.text,
            ablation_type=request.ablation_type,
            target_layer=request.target_layer,
            target_head=request.target_head,
            generated_text=ablated_text,
            baseline_text=baseline_text
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ablation experiment failed: {str(e)}"
        )
