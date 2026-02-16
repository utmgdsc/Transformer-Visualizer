from fastapi import APIRouter, HTTPException
import torch
from typing import List

from models.model_loader import model_manager
from schemas import InferenceRequest, InferenceResponse, TokenProbability

router = APIRouter(prefix="/v1", tags=["inference"])

@router.post("/predict", response_model=InferenceResponse)
async def predict_next_token(request: InferenceRequest):
    # check if model is loaded before processing
    if not model_manager.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model()
    
    try:
        # convert input text to tokens
        tokens = model.to_tokens(request.text)
        
        # run model forward pass to get logits
        with torch.no_grad():
            logits = model(tokens)
        
        # extract logits for the last token position
        final_logits = logits[0, -1, :]
        
        # apply temperature scaling and convert to probabilities
        probs = torch.softmax(final_logits / request.temperature, dim=-1)
        
        # get top k most probable tokens
        top_k_probs, top_k_indices = torch.topk(probs, request.top_k)
        
        # build list of token probabilities for response
        next_token_probs: List[TokenProbability] = []
        for prob, idx in zip(top_k_probs.tolist(), top_k_indices.tolist()):
            token_str = model.to_string(idx)
            next_token_probs.append(TokenProbability(
                token=token_str,
                probability=prob,
                token_id=idx
            ))
        
        # generate output text with most likely next token
        predicted_token_id = top_k_indices[0].item()
        generated_text = request.text + model.to_string(predicted_token_id)
        
        return InferenceResponse(
            input_text=request.text,
            generated_text=generated_text,
            next_token_probabilities=next_token_probs
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post("/generate")
async def generate_text(request: InferenceRequest):
    # check if model is loaded before processing
    if not model_manager.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model()
    
    try:
        # convert input text to tokens
        tokens = model.to_tokens(request.text)
        
        # start with input tokens
        generated_tokens = tokens.clone()
        
        # generate tokens one at a time
        for _ in range(request.max_tokens):
            # get logits for current sequence
            with torch.no_grad():
                logits = model(generated_tokens)
            
            # apply temperature and get probabilities for next token
            final_logits = logits[0, -1, :]
            probs = torch.softmax(final_logits / request.temperature, dim=-1)
            
            # sample next token from probability distribution
            next_token = torch.multinomial(probs, num_samples=1)
            generated_tokens = torch.cat([generated_tokens, next_token.unsqueeze(0)], dim=1)
        
        # convert tokens back to text
        generated_text = model.to_string(generated_tokens[0])
        
        return {
            "input_text": request.text,
            "generated_text": generated_text,
            "tokens_generated": request.max_tokens
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
