from transformer_lens import HookedTransformer
from typing import Optional
import torch

LANGUAGE_MODELS = {
    "en": "gpt2",
    "fr": "bigscience/bloom-560m",
    "zh": "bigscience/bloom-560m"
}

class ModelManager:
    def __init__(self):
        self.models: dict[str, HookedTransformer] = {}
        self.device: str = "cpu"
        self.curr_language: Optional[str] = None

    def load_model(self, language: str = "en", device: str = "cpu"):
        # skip if unsupported language
        if language not in LANGUAGE_MODELS:
            raise ValueError("Unsupported language.")

        # skip if already loaded
        if language in self.models:
            return self.models[language]

        model_name = LANGUAGE_MODELS[language]

        # reuse existing model instance if same model name is already loaded
        for lang, model in self.models.items():
            if LANGUAGE_MODELS.get(lang) == model_name:
                self.models[language] = model  # share the same instance
                return model

        # otherwise load fresh
        self.device = device
        self.models[language] = HookedTransformer.from_pretrained(
            model_name,
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