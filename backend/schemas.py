from pydantic import BaseModel
from typing import List, Dict

class InferenceRequest(BaseModel):
    # input text to generate from
    text: str
    
    # generation parameters
    max_tokens: int = 50
    temperature: float = 1.0
    top_k: int = 5

class TokenProbability(BaseModel):
    # token information
    token: str
    probability: float
    token_id: int

class InferenceResponse(BaseModel):
    # input and output text
    input_text: str
    generated_text: str
    
    # top k token predictions with probabilities
    next_token_probabilities: List[TokenProbability]
