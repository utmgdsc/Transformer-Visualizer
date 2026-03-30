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

    def extract_head_value_and_out(
        self,
        text: str,
        layer: int,
        head: int,
        include_bias: bool = True,
    ) -> Dict:
        """Extract a single head's attention pattern, value vectors, and out vectors.

        Returns a dict containing:
            attention_matrix: [seq, seq]
            value_vectors: [seq, d_head]
            out_vectors: [seq, d_model]  (per-head result after W_O)
            includes_bias: bool  (whether b_O/n_heads was added to out_vectors)
        """

        tokens = self.model.to_tokens(text)
        token_strings = self._tokens_to_strings(tokens)

        hook_pattern = f"blocks.{layer}.attn.hook_pattern"
        hook_v = f"blocks.{layer}.attn.hook_v"
        hook_result = f"blocks.{layer}.attn.hook_result"
        hook_z = f"blocks.{layer}.attn.hook_z"

        # Not all TransformerLens versions/models expose hook_result.
        # We'll prefer hook_result (per-head contribution in d_model) and fall back to hook_z (d_head).
        names_to_capture = {hook_pattern, hook_v, hook_result, hook_z}

        with torch.no_grad():
            _, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: name in names_to_capture,
            )

        required = [hook_pattern, hook_v]
        if any(n not in cache for n in required):
            missing = [n for n in required if n not in cache]
            raise RuntimeError(f"Missing activations in cache: {missing}")

        # pattern shape: [batch, head, q_pos, k_pos]
        pattern = cache[hook_pattern]
        if pattern.dim() == 4:
            pattern = pattern[0]
        if head >= pattern.shape[0]:
            raise ValueError(f"Invalid head index {head}. Model has {pattern.shape[0]} heads.")
        attention_matrix = pattern[head].detach().cpu().numpy().tolist()

        # v shape: [batch, pos, head, d_head]
        v = cache[hook_v]
        if v.dim() == 4:
            v = v[0]
        if head >= v.shape[1]:
            raise ValueError(f"Invalid head index {head}. Model has {v.shape[1]} heads.")
        value_vectors = v[:, head, :].detach().cpu().numpy().tolist()

        # b_O and n_heads are the same regardless of which hook path we take.
        b_O = getattr(self.model.blocks[layer].attn, "b_O", None)
        n_heads = self.model.cfg.n_heads
        bias_applied = b_O is not None and include_bias

        # Prefer per-head result in d_model if available; else fall back to z in d_head.
        if hook_result in cache:
            # result shape: [batch, pos, head, d_model]
            result = cache[hook_result]
            if result.dim() == 4:
                result = result[0]
            if head >= result.shape[1]:
                raise ValueError(
                    f"Invalid head index {head}. Model has {result.shape[1]} heads."
                )
            out = result[:, head, :]
            if bias_applied:
                out = out + (b_O / n_heads)
            out_vectors = out.detach().cpu().numpy().tolist()
            out_vector_kind = "result"
        elif hook_z in cache:
            # z shape: [batch, pos, head, d_head]
            z = cache[hook_z]
            if z.dim() == 4:
                z = z[0]
            if head >= z.shape[1]:
                raise ValueError(f"Invalid head index {head}. Model has {z.shape[1]} heads.")

            # Reconstruct per-head contribution in d_model space:
            # out_head[pos] = z[pos, head] @ W_O[head]  (+ optional share of b_O)
            # TransformerLens stores W_O as [n_heads, d_head, d_model] for GPT-style models.
            W_O = self.model.blocks[layer].attn.W_O  # type: ignore[attr-defined]

            z_head = z[:, head, :]  # [pos, d_head]
            out = z_head @ W_O[head]  # [pos, d_model]

            # b_O is applied after summing heads; we distribute it evenly so each head's
            # "out" still sums to the layer attn_out when you sum across heads.
            if bias_applied:
                out = out + (b_O / n_heads)

            out_vectors = out.detach().cpu().numpy().tolist()
            out_vector_kind = "reconstructed_from_z"
        else:
            raise RuntimeError(
                f"Missing activations in cache: {[hook_result, hook_z]} (need one for out vectors)"
            )

        return {
            "tokens": token_strings,
            "attention_matrix": attention_matrix,
            "value_vectors": value_vectors,
            "out_vectors": out_vectors,
            "out_vector_kind": out_vector_kind,
            "includes_bias": bias_applied,
        }

    def extract_all_heads_value_and_out(
        self,
        text: str,
        head: int,
        layer: Optional[int] = None,
        include_bias: bool = True,
        include_attention_matrix: bool = False,
    ) -> Dict:
        """Extract head-out data for a specific head across all (or one) layer(s).

        Returns:
            {
              "tokens": [...],
              "patterns": [
                 {"layer": int, "head": int, "attention_matrix": [[...]],
                  "value_vectors": [[...]], "out_vectors": [[...]], "out_vector_kind": str},
                 ...
              ]
            }
        """

        tokens = self.model.to_tokens(text)
        token_strings = self._tokens_to_strings(tokens)

        n_heads = self.model.cfg.n_heads
        if head < 0 or head >= n_heads:
            raise ValueError(f"Invalid head index {head}. Model has {n_heads} heads.")

        target_layers = [layer] if layer is not None else list(range(self.model.cfg.n_layers))

        # Capture patterns + v + z across target layers in one pass.
        # (hook_result isn't present for GPT-2 in this repo's TL version; we reconstruct)
        wanted_suffixes = ("attn.hook_pattern", "attn.hook_v", "attn.hook_z")

        with torch.no_grad():
            _, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: any(name.endswith(s) for s in wanted_suffixes)
                and any(name.startswith(f"blocks.{l}.") for l in target_layers),
            )

        patterns_out: List[Dict] = []

        for layer_idx in target_layers:
            hook_pattern = f"blocks.{layer_idx}.attn.hook_pattern"
            hook_v = f"blocks.{layer_idx}.attn.hook_v"
            hook_z = f"blocks.{layer_idx}.attn.hook_z"

            if hook_pattern not in cache or hook_v not in cache or hook_z not in cache:
                # skip if missing for some reason
                continue

            # pattern: [batch, head, q, k] -> [head, q, k]
            pattern = cache[hook_pattern]
            if pattern.dim() == 4:
                pattern = pattern[0]

            # v: [batch, pos, head, d_head] -> [pos, head, d_head]
            v = cache[hook_v]
            if v.dim() == 4:
                v = v[0]

            # z: [batch, pos, head, d_head] -> [pos, head, d_head]
            z = cache[hook_z]
            if z.dim() == 4:
                z = z[0]

            n_heads = pattern.shape[0]

            W_O = self.model.blocks[layer_idx].attn.W_O  # [head, d_head, d_model]
            b_O = getattr(self.model.blocks[layer_idx].attn, "b_O", None)

            attention_matrix = pattern[head].detach().cpu().numpy().tolist() if include_attention_matrix else None
            value_vectors = v[:, head, :].detach().cpu().numpy().tolist()

            z_head = z[:, head, :]
            out = z_head @ W_O[head]
            bias_applied = False
            if b_O is not None and include_bias:
                out = out + (b_O / n_heads)
                bias_applied = True
            out_vectors = out.detach().cpu().numpy().tolist()

            patterns_out.append(
                {
                    "layer": layer_idx,
                    "head": head,
                    "attention_matrix": attention_matrix,
                    "value_vectors": value_vectors,
                    "out_vectors": out_vectors,
                    "out_vector_kind": "reconstructed_from_z",
                    "includes_bias": bias_applied,
                }
            )

        return {"tokens": token_strings, "patterns": patterns_out}
    
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


def extract_attention_head_out_all(
    model: HookedTransformer,
    text: str,
    head: int,
    layer: Optional[int] = None,
    include_bias: bool = True,
    include_attention_matrix: bool = False,
) -> Dict:
    """Public interface for extracting head-out data for a specific head across layers."""
    extractor = AttentionExtractor(model)
    return extractor.extract_all_heads_value_and_out(
        text=text, head=head, layer=layer, include_bias=include_bias,
        include_attention_matrix=include_attention_matrix,
    )
