from transformer_lens import HookedTransformer
from typing import Optional
import torch

LANGUAGE_MODELS = {"en": "gpt2", "fr": "bigscience/bloom-560m"}

class ModelManager:
    def __init__(self):
        self.models: dict[str, HookedTransformer] = {}
        self.device: str = "cpu"
        self.curr_language: Optional[str] = None
    
    def load_model(self, language: str = "en", device: str = "cpu"):
        # skip loading if model is already loaded
        if language not in LANGUAGE_MODELS:
            raise ValueError("Unsupported language.")
        if language in self.models:
            return self.models[language]

        # update model configuration
        self.device = device
        # load pretrained model from transformerlens
        self.models[language] = HookedTransformer.from_pretrained(
            LANGUAGE_MODELS[language],
            device=device
        )
        return self.models[language]
    
    def get_model(self, language: str = "en") -> HookedTransformer:
        # ensure model is loaded before returning
        if language not in self.models:
            raise RuntimeError("Model not loaded. Call load_model first.")
        self.curr_language = language
        return self.models[language]
    
    def is_loaded(self, language: str = "en") -> bool:
        return language in self.models

# global model manager instance
model_manager = ModelManager()
