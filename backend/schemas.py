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


class LLMJudgeRequest(BaseModel):
    # input information
    input_text: str
    generated_text: str


class LLMJudgeResponse(BaseModel):
    # hallucination metric info
    score: float  # 0-1, higher = more correct / less hallucination
    conclusion: str  # "low", "medium", "high"
    reason: str  # explanation from judge model
    passed: bool  # True if the score meets the acceptance threshold
      
class QKVVectors(BaseModel):
    # QKV vectors for a specific token position
    token_position: int
    query: List[float]  # [d_model]
    key: List[float]    # [d_model]
    value: List[float]  # [d_model]


class QKVResponse(BaseModel):
    # input information
    input_text: str
    tokens: List[str]
    
    # QKV vectors for each layer and optionally specific head
    layer: int
    head: Optional[int]  # None if all heads averaged, specific index otherwise
    
    # QKV vectors for each token in the sequence
    qkv_vectors: List[QKVVectors]



class QKVRequest(BaseModel):
    # input text to analyze
    text: str
    
    # layer and head selection
    layer: int  # required for QKV extraction
    head: Optional[int] = None  # if None, average across all heads
    
    # which token positions to extract (None = all)
    token_positions: Optional[List[int]] = None
    
    # language selection
    language: str = "en"


class ResidualContribution(BaseModel):
    # how much each component contributes to the residual
    mlp_norm: float  # magnitude of MLP output
    attn_norm: float  # magnitude of attention output
    ratio: float  # MLP norm / attention norm


class TopNeuron(BaseModel):
    # identifies important neurons in MLP
    index: int
    value: float


class MLPOutput(BaseModel):
    # MLP output for a specific token
    token_position: int
    mlp_output: List[float]  # [d_model]
    
    # statistics about MLP activation
    mlp_mean: float
    mlp_std: float
    mlp_max: float
    mlp_min: float
    
    # residual information from attention head
    attention_residual: Optional[List[float]] = None
    attention_mean: Optional[float] = None
    attention_std: Optional[float] = None
    
    # how residuals combine through the layer
    residual_contribution: Optional[ResidualContribution] = None
    
    # most important neurons in this layer for this token
    top_neurons: List[TopNeuron]


class MLPRequest(BaseModel):
    # input text to analyze
    text: str
    
    # layer selection (required)
    layer: int
    
    # which token positions to extract (None = all)
    token_positions: Optional[List[int]] = None
    
    # language selection
    language: str = "en"


class MLPResponse(BaseModel):
    # input information
    input_text: str
    tokens: List[str]
    
    # MLP layer information
    layer: int
    
    # MLP outputs and residual data for each token
    mlp_outputs: List[MLPOutput]
