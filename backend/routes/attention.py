"""
Attention Routes: API endpoints for attention pattern extraction.
"""

from fastapi import APIRouter, HTTPException

from models.model_loader import model_manager
from schemas import AttentionRequest, AttentionResponse, AttentionPattern
from services.attention_service import extract_attention

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
