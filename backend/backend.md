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

## request parameters

- `text` (required): input text to generate from
- `max_tokens` (optional, default: 50): number of tokens to generate
- `temperature` (optional, default: 1.0): controls randomness (lower = more deterministic)
- `top_k` (optional, default: 5): number of top probable tokens to return
