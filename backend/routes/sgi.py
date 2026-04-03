"""
API endpoints for SGI (Semantic Grounding Index) metrics.
"""

from fastapi import APIRouter, HTTPException
from models.model_loader import model_manager
from services.sgi_service import SGICalculator
from schemas import SGIRequest, SGIResponse, SGITokenScore

router = APIRouter(prefix="/v1", tags=["sgi"])


@router.post("/sgi", response_model=SGIResponse)
async def calculate_sgi(request: SGIRequest):
    """
    Calculate Semantic Grounding Index for generated tokens.
    
    Supports two modes:
    1. Manual split: Provide 'context' and 'question' explicitly
    2. Auto-split: Provide 'full_text' and it will be automatically split
    
    Returns similarity scores showing how grounded each token is
    in the context vs just repeating the question.
    """
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # get the model for the specified language
        model = model_manager.get_model(language=request.language)
        
        # create SGI calculator
        calculator = SGICalculator(model)
        
        # determine if we need to auto-split or use provided context/question
        if request.full_text:
            # auto-split mode
            context, question, results = calculator.calculate_sgi_auto_split(
                full_text=request.full_text,
                generated_tokens=request.generated_tokens,
                split_at_sentence=request.split_at_sentence
            )
        elif request.context and request.question:
            # manual mode
            context = request.context
            question = request.question
            results = calculator.calculate_sgi(
                context=context,
                question=question,
                generated_tokens=request.generated_tokens
            )
        else:
            raise HTTPException(
                status_code=422,
                detail="Must provide either 'full_text' for auto-split OR both 'context' and 'question'"
            )
        
        # format results
        token_scores = [
            SGITokenScore(
                token=token,
                context_angular_distance=theta_rc,
                question_angular_distance=theta_rq,
                sgi_score=sgi_score
            )
            for token, theta_rc, theta_rq, sgi_score in results
        ]
        
        return SGIResponse(
            context=context,
            question=question,
            token_scores=token_scores
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"SGI calculation failed: {str(e)}"
        )
