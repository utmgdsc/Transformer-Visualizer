from pydantic import BaseModel
from typing import List, Literal, Optional


class InferenceRequest(BaseModel):
    # input text to generate from
    text: str
    
    # generation parameters
    max_tokens: int = 50
    temperature: float = 1.0
    top_k: int = 5
    language: str = "en"
    
    # optional hallucination metrics
    include_entropy: bool = False
    include_sgi: bool = False


class TokenProbability(BaseModel):
    # token information
    token: str
    probability: float
    token_id: int
    
    # optional hallucination metrics (only included if requested)
    entropy: Optional[float] = None
    conclusion: Optional[str] = None  # "low", "medium", "high"
    sgi_score: Optional[float] = None  # ratio: θ(r,q) / (θ(r,c) + ε) (> 1.0 = grounded)
    sgi_context_angular_distance: Optional[float] = None
    sgi_question_angular_distance: Optional[float] = None


class InferenceResponse(BaseModel):
    # input and output text
    input_text: str
    generated_text: str
    
    # top k token predictions with probabilities
    next_token_probabilities: List[TokenProbability]
    
    # SGI metadata (only if include_sgi=True)
    sgi_context: Optional[str] = None
    sgi_question: Optional[str] = None


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


class AttentionHeadOutRequest(BaseModel):
    """Request head-out data for a specific head, with an optional layer filter."""

    text: str
    layer: Optional[int] = None
    head: int
    include_bias: bool = True  # if True, b_O/n_heads is added to each head's out_vectors
    include_attention_matrix: bool = False  # if True, attention_matrix is included in each pattern
    language: str = "en"


class AttentionHeadOutPattern(BaseModel):
    """Head-out data for one (layer, head)."""

    layer: int
    head: int
    attention_matrix: Optional[List[List[float]]] = None  # [q, k]; only present when include_attention_matrix=True
    value_vectors: List[List[float]]  # [seq, d_head]
    out_vectors: List[List[float]]    # [seq, d_model]
    out_vector_kind: Literal["result", "reconstructed_from_z"]  # "result" or "reconstructed_from_z"
    includes_bias: bool               # whether b_O/n_heads was added to out_vectors


class AttentionHeadOutResponse(BaseModel):
    """Head-out data for one or more (layer, head) selections."""

    input_text: str
    tokens: List[str]
    patterns: List[AttentionHeadOutPattern]


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


class SGITokenScore(BaseModel):
    # SGI scores for a single token using angular distance
    token: str
    context_angular_distance: float  # angular distance to context (smaller = better grounded)
    question_angular_distance: float  # angular distance to question (smaller = just repeating)
    sgi_score: float  # ratio: θ(r,q) / (θ(r,c) + ε) (> 1.0 = grounded, < 1.0 = semantic laziness)


class SGIRequest(BaseModel):
    # text inputs
    context: Optional[str] = None  # source text / grounding information (if None, auto-split)
    question: Optional[str] = None  # user's input question (if None, auto-split)
    full_text: Optional[str] = None  # full text to auto-split (used if context/question are None)
    generated_tokens: List[str]  # tokens generated by the model
    
    # auto-split configuration
    split_at_sentence: bool = False  # if True, split at sentence boundary; else split at 80/20 (default)
    
    # language selection
    language: str = "en"


class SGIResponse(BaseModel):
    # input information
    context: str
    question: str
    
    # SGI scores for each generated token
    token_scores: List[SGITokenScore]


class EntropyTokenScore(BaseModel):
    # entropy data for a single token
    token: str
    entropy: float  # Shannon entropy (higher = more uncertain)
    conclusion: str  # "low", "medium", or "high" uncertainty
    top_probs: List[float]  # top 5 probabilities for context


class EntropyRequest(BaseModel):
    # input text to generate from
    text: str
    
    # generation parameters
    max_tokens: int = 50
    temperature: float = 1.0
    language: str = "en"
      
class EntropyResponse(BaseModel):
    # input and output text
    input_text: str
    generated_text: str
    
    # entropy scores for each generated token
    token_scores: List[EntropyTokenScore]
    
class TokenEmbedding(BaseModel):
    # token and its embedding vector
    token: str
    token_id: int
    embedding: List[float]  # [d_model]


class TokenizationRequest(BaseModel):
    # input text to tokenize
    text: str
    # language selection
    language: str = "en"

class TokenizationResponse(BaseModel):
    # input text
    input_text: str
    
    # total number of tokens
    num_tokens: int
    
    # embedding dimension
    embedding_dim: int
    
    # tokens with their IDs and embedding vectors
    token_embeddings: List[TokenEmbedding]
