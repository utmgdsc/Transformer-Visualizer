"""
Attention Service: Extracts attention patterns from TransformerLens models.

This module provides functionality to:
1. Extract attention patterns for specific layers/heads
2. Convert raw attention tensors to serializable formats
3. Handle hook registration and cleanup
"""

import torch
from typing import List, Dict, Optional, Tuple
from transformer_lens import HookedTransformer


class AttentionExtractor:
    """Encapsulates attention pattern extraction logic."""
    
    def __init__(self, model: HookedTransformer):
        self.model = model
        self.attention_cache: Dict[str, torch.Tensor] = {}
    
    def extract_attention_patterns(
        self,
        text: str,
        layer: Optional[int] = None,
        head: Optional[int] = None
    ) -> Tuple[List[str], List[Dict]]:
        """
        Extract attention patterns for specified layers/heads.
        
        Args:
            text: Input text to analyze
            layer: Specific layer index (None for all layers)
            head: Specific head index (None for all heads)
        
        Returns:
            Tuple of (tokens, patterns) where patterns is a list of dicts
            containing layer, head, and attention matrix data.
        """
        # tokenize input
        tokens = self.model.to_tokens(text)
        token_strings = self._tokens_to_strings(tokens)
        
        # determine which layers to extract
        target_layers = [layer] if layer is not None else list(range(self.model.cfg.n_layers))
        
        # run model with cache to capture attention patterns
        with torch.no_grad():
            logits, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: name.endswith("attn.hook_pattern")
            )
            
            # extract attention from cache
            patterns = self._extract_patterns_from_cache(cache, target_layers, head)
        
        return token_strings, patterns
    
    def _tokens_to_strings(self, tokens: torch.Tensor) -> List[str]:
        """Convert token tensor to list of string tokens."""
        return [
            self.model.to_string(tokens[0, i].item())
            for i in range(tokens.shape[1])
        ]
    
    def _extract_patterns_from_cache(
        self,
        cache: Dict,
        layers: List[int],
        head: Optional[int]
    ) -> List[Dict]:
        """
        Extract attention patterns from model cache.
        
        Args:
            cache: Cache dictionary from run_with_cache
            layers: List of layer indices to extract
            head: Specific head index (None for all heads)
        
        Returns:
            List of pattern dictionaries with layer, head, and matrix data.
        """
        patterns = []
        
        for layer_idx in layers:
            # get attention pattern for this layer from cache
            hook_name = f"blocks.{layer_idx}.attn.hook_pattern"
            
            if hook_name not in cache:
                continue
            
            # shape: [batch, n_heads, seq_len, seq_len]
            attention_tensor = cache[hook_name]
            
            # remove batch dimension if present
            if attention_tensor.dim() == 4:
                attention_tensor = attention_tensor[0]  # [n_heads, seq_len, seq_len]
            
            # determine which heads to extract
            n_heads = attention_tensor.shape[0]
            target_heads = [head] if head is not None else list(range(n_heads))
            
            for head_idx in target_heads:
                if head_idx >= n_heads:
                    continue
                
                # extract attention matrix for this head
                attn_matrix = attention_tensor[head_idx].cpu().numpy()
                
                patterns.append({
                    "layer": layer_idx,
                    "head": head_idx,
                    "attention_matrix": attn_matrix.tolist()
                })
        
        return patterns


def extract_attention(
    model: HookedTransformer,
    text: str,
    layer: Optional[int] = None,
    head: Optional[int] = None
) -> Tuple[List[str], List[Dict]]:
    """
    Public interface for attention extraction.
    
    Args:
        model: TransformerLens HookedTransformer model
        text: Input text to analyze
        layer: Specific layer index (None for all layers)
        head: Specific head index (None for all heads)
    
    Returns:
        Tuple of (tokens, patterns) where patterns is serializable.
    """
    extractor = AttentionExtractor(model)
    return extractor.extract_attention_patterns(text, layer, head)
