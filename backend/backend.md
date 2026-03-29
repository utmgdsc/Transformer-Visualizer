# Transformer Visualizer Backend

## run server

```bash
uvicorn main:app --reload
```

## API endpoints

### health check

```text
GET /health
```

response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "gpt2"
}
```

### predict next token

```text
POST /v1/predict
```

request body:

```json
{
  "text": "The quick brown fox",
  "temperature": 1.0,
  "top_k": 5
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "generated_text": "The quick brown fox jumps",
  "next_token_probabilities": [
    {
      "token": " jumps",
      "probability": 0.45,
      "token_id": 14523
    },
    {
      "token": " jumped",
      "probability": 0.25,
      "token_id": 11687
    },
    {
      "token": " is",
      "probability": 0.15,
      "token_id": 318
    }
  ]
}
```

### generate text

```text
POST /v1/generate
```

request body:

```json
{
  "text": "Once upon a time",
  "max_tokens": 50,
  "temperature": 0.8,
  "top_k": 5
}
```

response:

```json
{
  "input_text": "Once upon a time",
  "generated_text": "Once upon a time there was a little girl who lived in a small village...",
  "tokens_generated": 50
}
```

### tokenize text and get embeddings

```text
POST /v1/tokenize
```

request body:

```json
{
  "text": "The quick brown fox",
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "num_tokens": 4,
  "embedding_dim": 768,
  "token_embeddings": [
    {
      "token": "The",
      "token_id": 464,
      "embedding": [0.123, -0.456, 0.789, ...]
    },
    {
      "token": " quick",
      "token_id": 2068,
      "embedding": [0.234, -0.567, 0.890, ...]
    },
    {
      "token": " brown",
      "token_id": 2812,
      "embedding": [0.345, -0.678, 0.901, ...]
    },
    {
      "token": " fox",
      "token_id": 6419,
      "embedding": [0.456, -0.789, 0.123, ...]
    }
  ]
}
```

**Parameters:**

- `text` (required): input text to tokenize
- `language` (optional, default: "en"): language model to use ("en" or "fr")

**Returns:**

- `input_text`: the original input text
- `num_tokens`: total number of tokens
- `embedding_dim`: dimension of each embedding vector
- `token_embeddings`: list of token objects containing:
  - `token`: the token string representation
  - `token_id`: the numeric token ID
  - `embedding`: the embedding vector for this token (before any layer processing)

### extract attention patterns

```text
POST /v1/attention
```

request body:

```json
{
  "text": "The quick brown fox",
  "layer": 0,
  "head": null,
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "tokens": ["The", " quick", " brown", " fox"],
  "patterns": [
    {
      "layer": 0,
      "head": 0,
      "attention_matrix": [
        [0.8, 0.1, 0.05, 0.05],
        [0.2, 0.6, 0.15, 0.05],
        [0.1, 0.2, 0.6, 0.1],
        [0.05, 0.1, 0.2, 0.65]
      ]
    }
  ]
}
```

**Parameters:**

- `text` (required): input text to analyze
- `layer` (optional): specific layer index to extract (None = all layers)
- `head` (optional): specific attention head to extract (None = all heads)
- `language` (optional, default: "en"): language model to use ("en" or "fr")

### extract attention head out (Attention × Value = Out)

```text
POST /v1/attention/head-out
```

request body:

```json
{
  "text": "The quick brown fox",
  "layer": 0,
  "head": 0,
  "include_bias": true,
  "include_attention_matrix": false,
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "tokens": ["The", " quick", " brown", " fox"],
  "patterns": [
    {
      "layer": 0,
      "head": 0,
      "attention_matrix": null,
      "value_vectors": [[...], ...],
      "out_vectors": [[...], ...],
      "out_vector_kind": "reconstructed_from_z",
      "includes_bias": true
    }
  ]
}
```

**Note:** `value_vectors` has shape `[seq_len, d_head]` and `out_vectors` has shape `[seq_len, d_model]`. Vectors are abbreviated above for clarity. `attention_matrix` is `null` by default; set `include_attention_matrix: true` to receive it with shape `[seq_len, seq_len]`.

**Parameters:**

- `text` (required): input text to analyze
- `head` (required): specific attention head index to extract
- `layer` (optional): specific layer index to extract (None = all layers)
- `include_bias` (optional, default: `true`): when `true`, distributes `b_O / n_heads` into each head's `out_vectors` so they sum to the full layer attention output; set to `false` to get pure per-head contributions without any bias term
- `include_attention_matrix` (optional, default: `false`): when `true`, includes the `[seq_len, seq_len]` attention matrix in each pattern; omitted by default to reduce response size
- `language` (optional, default: "en"): language model to use ("en" or "fr")

### ablation experiment

```text
POST /v1/ablate
```

request body:

```json
{
  "text": "The quick brown fox",
  "ablation_type": "zero",
  "target_layer": 2,
  "target_head": 3,
  "scale_factor": 0.5,
  "max_tokens": 20,
  "temperature": 1.0,
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "ablation_type": "zero",
  "target_layer": 2,
  "target_head": 3,
  "generated_text": "The quick brown fox runs",
  "baseline_text": "The quick brown fox jumps"
}
```

**Parameters:**

- `text` (required): input text for inference
- `ablation_type` (optional, default: "zero"): type of ablation ("zero", "mean", "scale")
  - `zero`: Set activations to zero
  - `mean`: Replace activations with their mean
  - `scale`: Scale activations by scale_factor
- `target_layer` (required): layer index to ablate
- `target_head` (optional): specific head to ablate (None = ablate entire layer)
- `scale_factor` (optional, default: 1.0): scaling factor for "scale" ablation type
- `max_tokens` (optional, default: 50): number of tokens to generate
- `temperature` (optional, default: 1.0): sampling temperature
- `language` (optional, default: "en"): language model to use

### extract QKV vectors

```text
POST /v1/qkv
```

request body:

```json
{
  "text": "The quick brown fox",
  "layer": 2,
  "head": 3,
  "token_positions": [0, 1, 3],
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "tokens": ["The", " quick", " brown", " fox"],
  "layer": 2,
  "head": 3,
  "qkv_vectors": [
    {
      "token_position": 0,
      "query": [0.123, -0.456, 0.789, ...],
      "key": [0.234, -0.567, 0.890, ...],
      "value": [0.345, -0.678, 0.901, ...]
    },
    {
      "token_position": 1,
      "query": [0.456, -0.789, 0.123, ...],
      "key": [0.567, -0.890, 0.234, ...],
      "value": [0.678, -0.901, 0.345, ...]
    }
  ]
}
```

**Parameters:**

- `text` (required): input text to analyze
- `layer` (required): layer index to extract QKV from
- `head` (optional): specific attention head to extract (None = average across all heads)
- `token_positions` (optional): list of token indices to extract (None = all tokens)
- `language` (optional, default: "en"): language model to use ("en" or "fr")

**Notes:**

- Query (Q): What the token is looking for in other tokens
- Key (K): How the token represents itself to be searched for
- Value (V): What the token contributes to the output when attended to
- Each vector has dimension `d_head` (typically 64 for smaller models)
- When `head` is None, vectors are averaged across all heads in that layer

### extract MLP outputs and residuals

```text
POST /v1/mlp
```

request body:

```json
{
  "text": "The quick brown fox",
  "layer": 2,
  "token_positions": [0, 1, 3],
  "language": "en"
}
```

response:

```json
{
  "input_text": "The quick brown fox",
  "tokens": ["The", " quick", " brown", " fox"],
  "layer": 2,
  "mlp_outputs": [
    {
      "token_position": 0,
      "mlp_output": [0.123, -0.456, 0.789, ...],
      "mlp_mean": 0.045,
      "mlp_std": 0.342,
      "mlp_max": 2.156,
      "mlp_min": -1.834,
      "attention_residual": [0.234, -0.567, 0.890, ...],
      "attention_mean": 0.078,
      "attention_std": 0.298,
      "residual_contribution": {
        "mlp_norm": 4.567,
        "attn_norm": 3.892,
        "ratio": 1.173
      },
      "top_neurons": [
        {"index": 1024, "value": 2.156},
        {"index": 2048, "value": 1.989},
        {"index": 512, "value": 1.845}
      ]
    }
  ]
}
```

**Parameters:**

- `text` (required): input text to analyze
- `layer` (required): layer index to extract MLP from
- `token_positions` (optional): list of token indices to extract (None = all tokens)
- `language` (optional, default: "en"): language model to use ("en" or "fr")

**Notes:**

- **MLP Output**: Feed-forward network output for each token (dimension d_model)
- **Statistics**: Mean, std, max, min values show the distribution of MLP activations
- **Attention Residual**: Output from the attention head (flows into MLP via residual connection)
- **Residual Contribution:**
  - `mlp_norm`: Magnitude of MLP output
  - `attn_norm`: Magnitude of attention output
  - `ratio`: How much MLP dominates vs attention (>1 means MLP is stronger)
- **Top Neurons**: Most important neurons that fire strongly for this token
  - Helps understand which parts of the feed-forward network are active

## request parameters

- `text` (required): input text to generate from
- `max_tokens` (optional, default: 50): number of tokens to generate
- `temperature` (optional, default: 1.0): controls randomness (lower = more deterministic)
- `top_k` (optional, default: 5): number of top probable tokens to return
