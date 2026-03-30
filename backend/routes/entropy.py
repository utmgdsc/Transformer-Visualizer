"""
API endpoints for Predictive Entropy metrics.
"""

from fastapi import APIRouter, HTTPException
from models.model_loader import model_manager
from services.entropy_service import EntropyCalculator
from schemas import EntropyRequest, EntropyResponse, EntropyTokenScore

router = APIRouter(prefix="/v1", tags=["entropy"])


@router.post("/entropy", response_model=EntropyResponse)
async def calculate_entropy(request: EntropyRequest):
    """
    Calculate predictive entropy for generated tokens.
    
    Measures model uncertainty - high entropy indicates the model
    is guessing and more likely to hallucinate.
    """
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # get the model for the specified language
        model = model_manager.get_model(language=request.language)
        
        # create entropy calculator
        calculator = EntropyCalculator(model)
        
        # calculate entropy for generation
        generated_text, results = calculator.calculate_entropy(
            input_text=request.text,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # format results
        token_scores = [
            EntropyTokenScore(
                token=token,
                entropy=entropy,
                conclusion=calculator.classify_entropy_level(entropy),
                top_probs=top_probs
            )
            for token, entropy, top_probs in results
        ]
        
        return EntropyResponse(
            input_text=request.text,
            generated_text=generated_text,
            token_scores=token_scores
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Entropy calculation failed: {str(e)}"
        )
