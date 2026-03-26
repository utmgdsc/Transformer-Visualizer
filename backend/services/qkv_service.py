import torch
from typing import List, Dict, Optional, Tuple
from transformer_lens import HookedTransformer


class QKVExtractor:
    """Encapsulates QKV vector extraction logic."""
    
    def __init__(self, model: HookedTransformer):
        self.model = model
    
    def extract_qkv_vectors(
        self,
        text: str,
        layer: int,
        head: Optional[int] = None,
        token_positions: Optional[List[int]] = None
    ) -> Tuple[List[str], List[Dict]]:
        """
        Extract QKV vectors for specified layer and head.
        
        Args:
            text: Input text to analyze
            layer: Layer index to extract from
            head: Specific head index (None to average across all heads)
            token_positions: Specific token positions to extract (None for all)
        
        Returns:
            Tuple of (tokens, qkv_vectors) where qkv_vectors is a list of dicts
            containing token_position, query, key, value data.
        """
        # tokenize input
        tokens = self.model.to_tokens(text)
        token_strings = self._tokens_to_strings(tokens)
        
        # validate layer
        if layer < 0 or layer >= self.model.cfg.n_layers:
            raise ValueError(f"Layer {layer} out of range [0, {self.model.cfg.n_layers - 1}]")
        
        # validate head if specified
        if head is not None and (head < 0 or head >= self.model.cfg.n_heads):
            raise ValueError(f"Head {head} out of range [0, {self.model.cfg.n_heads - 1}]")
        
        # run model with cache to capture QKV
        with torch.no_grad():
            logits, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: (
                    name.endswith("attn.hook_q") or
                    name.endswith("attn.hook_k") or
                    name.endswith("attn.hook_v")
                )
            )
            
            # extract QKV from cache
            qkv_vectors = self._extract_qkv_from_cache(
                cache, layer, head, token_positions
            )
        
        return token_strings, qkv_vectors
    
    def _tokens_to_strings(self, tokens: torch.Tensor) -> List[str]:
        """Convert token tensor to list of string tokens."""
        return [
            self.model.to_string(tokens[0, i].item())
            for i in range(tokens.shape[1])
        ]
    
    def _extract_qkv_from_cache(
        self,
        cache: Dict,
        layer: int,
        head: Optional[int],
        token_positions: Optional[List[int]]
    ) -> List[Dict]:
        """
        Extract QKV vectors from model cache.
        
        Args:
            cache: Cache dictionary from run_with_cache
            layer: Layer index to extract from
            head: Specific head index (None to average)
            token_positions: Token positions to extract
        
        Returns:
            List of QKV vector dictionaries.
        """
        # get QKV tensors for this layer
        q_name = f"blocks.{layer}.attn.hook_q"
        k_name = f"blocks.{layer}.attn.hook_k"
        v_name = f"blocks.{layer}.attn.hook_v"
        
        if q_name not in cache or k_name not in cache or v_name not in cache:
            raise ValueError(f"Could not find QKV hooks for layer {layer}")
        
        # shape: [batch, seq_len, n_heads, d_head]
        q_tensor = cache[q_name]
        k_tensor = cache[k_name]
        v_tensor = cache[v_name]
        
        # remove batch dimension
        if q_tensor.dim() == 4:
            q_tensor = q_tensor[0]  # [seq_len, n_heads, d_head]
            k_tensor = k_tensor[0]
            v_tensor = v_tensor[0]
        
        seq_len = q_tensor.shape[0]
        d_head = q_tensor.shape[-1]
        
        # determine which token positions to extract
        if token_positions is None:
            positions = list(range(seq_len))
        else:
            positions = [p for p in token_positions if 0 <= p < seq_len]
        
        qkv_vectors = []
        
        for token_idx in positions:
            # extract QKV for this token position
            if head is not None:
                # specific head: use that head's vectors
                q_vec = q_tensor[token_idx, head, :].cpu().numpy()  # [d_head]
                k_vec = k_tensor[token_idx, head, :].cpu().numpy()
                v_vec = v_tensor[token_idx, head, :].cpu().numpy()
            else:
                # average across all heads
                q_vec = q_tensor[token_idx, :, :].mean(dim=0).cpu().numpy()  # [d_head]
                k_vec = k_tensor[token_idx, :, :].mean(dim=0).cpu().numpy()
                v_vec = v_tensor[token_idx, :, :].mean(dim=0).cpu().numpy()
            
            qkv_vectors.append({
                "token_position": token_idx,
                "query": q_vec.tolist(),
                "key": k_vec.tolist(),
                "value": v_vec.tolist()
            })
        
        return qkv_vectors


def extract_qkv(
    model: HookedTransformer,
    text: str,
    layer: int,
    head: Optional[int] = None,
    token_positions: Optional[List[int]] = None
) -> Tuple[List[str], List[Dict]]:
    """
    Public interface for QKV extraction.
    
    Args:
        model: TransformerLens HookedTransformer model
        text: Input text to analyze
        layer: Layer index to extract from
        head: Specific head index (None to average)
        token_positions: Token positions to extract (None for all)
    
    Returns:
        Tuple of (tokens, qkv_vectors) where qkv_vectors is serializable.
    """
    extractor = QKVExtractor(model)
    return extractor.extract_qkv_vectors(text, layer, head, token_positions)
