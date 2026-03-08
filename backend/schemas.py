from pydantic import BaseModel
from typing import List, Optional


class InferenceRequest(BaseModel):
    # input text to generate from
    text: str
    
    # generation parameters
    max_tokens: int = 50
    temperature: float = 1.0
    top_k: int = 5
    language: str = "en"


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


class AttentionRequest(BaseModel):
    # input text to analyze
    text: str
    
    # layer and head selection
    layer: Optional[int] = None  # if None, return all layers
    head: Optional[int] = None   # if None, return all heads
    
    # language selection
    language: str = "en"


class AttentionPattern(BaseModel):
    # attention matrix for a specific head
    layer: int
    head: int
    attention_matrix: List[List[float]]  # [seq_len, seq_len]
    

class AttentionResponse(BaseModel):
    # input information
    input_text: str
    tokens: List[str]
    
    # attention patterns for requested layers/heads
    patterns: List[AttentionPattern]


class AblationRequest(BaseModel):
    # input text for inference
    text: str
    
    # ablation configuration
    ablation_type: str = "zero"  # "zero", "mean", "scale"
    target_layer: int
    target_head: Optional[int] = None  # if None, ablate entire layer
    scale_factor: float = 1.0  # used for scaling ablation
    
    # generation parameters
    max_tokens: int = 50
    temperature: float = 1.0
    language: str = "en"


class AblationResponse(BaseModel):
    # input information
    input_text: str
    
    # ablation details
    ablation_type: str
    target_layer: int
    target_head: Optional[int]
    
    # generation results
    generated_text: str
    baseline_text: str  # generation without ablation for comparison
