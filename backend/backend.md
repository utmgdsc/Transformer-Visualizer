## run server
```bash
uvicorn main:app --reload
```

## API endpoints

### health check
```
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
```
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
```
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

## request parameters

- `text` (required): input text to generate from
- `max_tokens` (optional, default: 50): number of tokens to generate
- `temperature` (optional, default: 1.0): controls randomness (lower = more deterministic)
- `top_k` (optional, default: 5): number of top probable tokens to return
