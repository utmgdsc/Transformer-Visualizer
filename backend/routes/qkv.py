from fastapi import APIRouter, HTTPException

from models.model_loader import model_manager
from schemas import QKVRequest, QKVResponse, QKVVectors
from services.qkv_service import extract_qkv

router = APIRouter(prefix="/v1", tags=["qkv"])


@router.post("/qkv", response_model=QKVResponse)
async def get_qkv_vectors(request: QKVRequest):
    """
    Extract Query, Key, and Value vectors from attention layers.
    
    These vectors represent the learned representations that drive attention:
    - Query (Q): What this token is looking for
    - Key (K): What this token represents to others
    - Value (V): What this token contributes to the output
    
    Can extract for a specific head or average across all heads.
    """
    # check if model is loaded
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
    try:
        # validate layer
        if request.layer < 0 or request.layer >= model.cfg.n_layers:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid layer. Must be between 0 and {model.cfg.n_layers - 1}"
            )
        
        # validate head if specified
        if request.head is not None:
            if request.head < 0 or request.head >= model.cfg.n_heads:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid head. Must be between 0 and {model.cfg.n_heads - 1}"
                )
        
        # extract QKV vectors using service layer
        tokens, qkv_data = extract_qkv(
            model=model,
            text=request.text,
            layer=request.layer,
            head=request.head,
            token_positions=request.token_positions
        )
        
        # convert to response format
        qkv_vectors = [
            QKVVectors(
                token_position=q["token_position"],
                query=q["query"],
                key=q["key"],
                value=q["value"]
            )
            for q in qkv_data
        ]
        
        return QKVResponse(
            input_text=request.text,
            tokens=tokens,
            layer=request.layer,
            head=request.head,
            qkv_vectors=qkv_vectors
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"QKV extraction failed: {str(e)}"
        )
