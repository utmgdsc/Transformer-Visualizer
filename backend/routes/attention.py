"""
Attention Routes: API endpoints for attention pattern extraction.
"""

from fastapi import APIRouter, HTTPException

from models.model_loader import model_manager
from schemas import (
    AttentionRequest,
    AttentionResponse,
    AttentionPattern,
    AttentionHeadOutRequest,
    AttentionHeadOutResponse,
    AttentionHeadOutPattern,
)
from services.attention_service import (
    extract_attention,
    extract_attention_head_out_all,
)

router = APIRouter(prefix="/v1", tags=["attention"])


@router.post("/attention", response_model=AttentionResponse)
async def get_attention_patterns(request: AttentionRequest):
    """
    Extract attention patterns from the model.
    
    Returns the attention matrix showing how much each token attends to 
    previous tokens. Can filter by specific layer/head or return all.
    """
    # check if model is loaded
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
    try:
        # extract attention patterns using service layer
        tokens, patterns = extract_attention(
            model=model,
            text=request.text,
            layer=request.layer,
            head=request.head
        )
        
        # convert to response format
        attention_patterns = [
            AttentionPattern(
                layer=p["layer"],
                head=p["head"],
                attention_matrix=p["attention_matrix"]
            )
            for p in patterns
        ]
        
        return AttentionResponse(
            input_text=request.text,
            tokens=tokens,
            patterns=attention_patterns
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Attention extraction failed: {str(e)}"
        )


@router.post("/attention/head-out", response_model=AttentionHeadOutResponse)
async def get_attention_head_out(request: AttentionHeadOutRequest):
    """Return "Attention x Value = Out" data for a specific head, optionally filtered by layer."""

    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")

    model = model_manager.get_model(request.language)

    # validate indices early
    if request.layer is not None and (request.layer < 0 or request.layer >= model.cfg.n_layers):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layer. Must be between 0 and {model.cfg.n_layers - 1}",
        )
    if request.head < 0 or request.head >= model.cfg.n_heads:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid head. Must be between 0 and {model.cfg.n_heads - 1}",
        )

    try:
        data = extract_attention_head_out_all(
            model=model,
            text=request.text,
            head=request.head,
            layer=request.layer,
            include_bias=request.include_bias,
            include_attention_matrix=request.include_attention_matrix,
        )

        patterns = [
            AttentionHeadOutPattern(
                layer=p["layer"],
                head=p["head"],
                attention_matrix=p["attention_matrix"],
                value_vectors=p["value_vectors"],
                out_vectors=p["out_vectors"],
                out_vector_kind=p["out_vector_kind"],
                includes_bias=p["includes_bias"],
            )
            for p in data["patterns"]
        ]

        return AttentionHeadOutResponse(
            input_text=request.text,
            tokens=data["tokens"],
            patterns=patterns,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Head-out extraction failed: {str(e)}")
