from fastapi import APIRouter, HTTPException
import torch
from typing import List, Optional

from models.model_loader import model_manager

from schemas import (
    InferenceRequest, InferenceResponse, TokenProbability,
    TokenizationRequest, TokenizationResponse, TokenEmbedding
)
from services.entropy_service import EntropyCalculator
from services.sgi_service import SGICalculator, split_text_for_sgi

router = APIRouter(prefix="/v1", tags=["inference"])


@router.post("/predict", response_model=InferenceResponse)
async def predict_next_token(request: InferenceRequest):
    # check if model is loaded before processing
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
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
        
        # collect all top-k token strings upfront
        top_k_tokens = [(prob, idx, model.to_string(idx)) for prob, idx in zip(top_k_probs.tolist(), top_k_indices.tolist())]
        
        # compute entropy once outside the loop (same for all top-k tokens)
        entropy: Optional[float] = None
        conclusion: Optional[str] = None
        if request.include_entropy:
            entropy_calculator = EntropyCalculator(model)
            entropy = EntropyCalculator.calculate_entropy_from_logits(final_logits, request.temperature)
            conclusion = entropy_calculator.classify_entropy_level(entropy)
        
        # prepare SGI if requested - compute for all tokens at once
        sgi_context: Optional[str] = None
        sgi_question: Optional[str] = None
        sgi_results_map: dict = {}
        if request.include_sgi:
            sgi_calculator = SGICalculator(model)
            sgi_context, sgi_question = split_text_for_sgi(request.text)
            if sgi_context and sgi_question:
                token_strings = [token_str for _, _, token_str in top_k_tokens]
                sgi_results = sgi_calculator.calculate_sgi(sgi_context, sgi_question, token_strings)
                sgi_results_map = {token_str: (theta_rc, theta_rq, sgi_score) for token_str, theta_rc, theta_rq, sgi_score in sgi_results}
        
        # build list of token probabilities for response
        next_token_probs: List[TokenProbability] = []
        for prob, idx, token_str in top_k_tokens:
            # base token data
            token_data = {
                "token": token_str,
                "probability": prob,
                "token_id": idx
            }
            
            # add entropy if requested (same value for all tokens - derived from final_logits)
            if request.include_entropy and entropy is not None:
                token_data["entropy"] = entropy
                token_data["conclusion"] = conclusion
            
            # add SGI if requested
            if request.include_sgi and token_str in sgi_results_map:
                theta_rc, theta_rq, sgi_score = sgi_results_map[token_str]
                token_data["sgi_score"] = sgi_score
                token_data["sgi_context_angular_distance"] = theta_rc
                token_data["sgi_question_angular_distance"] = theta_rq
            
            next_token_probs.append(TokenProbability(**token_data))
        
        # generate output text with most likely next token
        predicted_token_id = top_k_indices[0].item()
        generated_text = request.text + model.to_string(predicted_token_id)
        
        response_data = {
            "input_text": request.text,
            "generated_text": generated_text,
            "next_token_probabilities": next_token_probs
        }
        
        # add SGI metadata if requested
        if request.include_sgi:
            response_data["sgi_context"] = sgi_context
            response_data["sgi_question"] = sgi_question
        
        return InferenceResponse(**response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post("/generate")
async def generate_text(request: InferenceRequest):
    # check if model is loaded before processing
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
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

@router.post("/tokenize", response_model=TokenizationResponse)
async def tokenize_text(request: TokenizationRequest):
    # check if model is loaded before processing
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
    try:
        # tokenize input text
        tokens = model.to_tokens(request.text)
        token_ids = tokens[0].tolist()  # [seq_len]
        
        # get token strings
        token_strings = [model.to_string(token_id) for token_id in token_ids]
        
        # extract embeddings by running the model and capturing token embeddings
        with torch.no_grad():
            # run model with cache to get embeddings from the embed hook
            logits, cache = model.run_with_cache(
                tokens,
                names_filter=lambda name: name == "blocks.0.hook_resid_pre"
            )
            
            # get the input embeddings (before any layer processing)
            # the embed hook captures embeddings after token embedding + position embedding
            resid_pre = cache["blocks.0.hook_resid_pre"]  # [batch, seq_len, d_model]
            embeddings = resid_pre[0].cpu().numpy()  # [seq_len, d_model]
        
        # build token embedding objects
        token_embeddings = [
            TokenEmbedding(
                token=token_str,
                token_id=token_id,
                embedding=embedding.tolist()
            )
            for token_str, token_id, embedding in zip(token_strings, token_ids, embeddings)
        ]
        
        return TokenizationResponse(
            input_text=request.text,
            num_tokens=len(token_strings),
            embedding_dim=embeddings.shape[1],
            token_embeddings=token_embeddings
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tokenization failed: {str(e)}")
