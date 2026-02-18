from transformer_lens import HookedTransformer
from typing import Optional
import torch

class ModelManager:
    def __init__(self):
        self.model: Optional[HookedTransformer] = None
        self.model_name: Optional[str] = None
        self.device: str = "cpu"
    
    def load_model(self, model_name: str = "gpt2", device: str = "cpu"):
        # skip loading if model is already loaded
        if self.model is not None and self.model_name == model_name:
            return self.model
        
        # update model configuration
        self.device = device
        self.model_name = model_name
        
        # load pretrained model from transformerlens
        self.model = HookedTransformer.from_pretrained(
            model_name,
            device=device
        )
        return self.model
    
    def get_model(self) -> HookedTransformer:
        # ensure model is loaded before returning
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model first.")
        return self.model
    
    def is_loaded(self) -> bool:
        return self.model is not None

# global model manager instance
model_manager = ModelManager()
