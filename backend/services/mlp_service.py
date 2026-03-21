import torch
from typing import List, Dict, Optional, Tuple
from transformer_lens import HookedTransformer


class MLPExtractor:
    """Encapsulates MLP and residual extraction logic."""
    
    def __init__(self, model: HookedTransformer):
        self.model = model
    
    def extract_mlp_and_residuals(
        self,
        text: str,
        layer: int,
        token_positions: Optional[List[int]] = None
    ) -> Tuple[List[str], List[Dict]]:
        """
        Extract MLP outputs and residual information for a specific layer.
        
        The MLP (Multi-Layer Perceptron) processes each token's representation,
        and residuals show how information flows through the layer.
        
        Args:
            text: Input text to analyze
            layer: Layer index to extract from
            token_positions: Specific token positions to extract (None for all)
        
        Returns:
            Tuple of (tokens, mlp_data) where mlp_data contains MLP outputs
            and residual information.
        """
        # tokenize input
        tokens = self.model.to_tokens(text)
        token_strings = self._tokens_to_strings(tokens)
        
        # validate layer
        if layer < 0 or layer >= self.model.cfg.n_layers:
            raise ValueError(f"Layer {layer} out of range [0, {self.model.cfg.n_layers - 1}]")
        
        # run model with cache to capture MLP and residuals
        with torch.no_grad():
            logits, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: (
                    name.endswith("mlp.hook_post") or  # MLP output
                    name.endswith("attn.hook_result") or  # Attention output (residual input)
                    name.endswith("ln1.hook_normalized")  # Layer norm before attention
                )
            )
            
            # extract MLP data
            mlp_data = self._extract_mlp_from_cache(
                cache, layer, token_positions
            )
        
        return token_strings, mlp_data
    
    def _tokens_to_strings(self, tokens: torch.Tensor) -> List[str]:
        """Convert token tensor to list of string tokens."""
        return [
            self.model.to_string(tokens[0, i].item())
            for i in range(tokens.shape[1])
        ]
    
    def _extract_mlp_from_cache(
        self,
        cache: Dict,
        layer: int,
        token_positions: Optional[List[int]]
    ) -> List[Dict]:
        """
        Extract MLP outputs and residuals from model cache.
        
        Args:
            cache: Cache dictionary from run_with_cache
            layer: Layer index to extract from
            token_positions: Token positions to extract
        
        Returns:
            List of MLP data dictionaries with outputs and residual info.
        """
        # get hook names for this layer
        mlp_post_name = f"blocks.{layer}.mlp.hook_post"
        attn_result_name = f"blocks.{layer}.attn.hook_result"
        ln1_name = f"blocks.{layer}.ln1.hook_normalized"
        
        if mlp_post_name not in cache:
            raise ValueError(f"Could not find MLP hooks for layer {layer}")
        
        # shape: [batch, seq_len, d_model]
        mlp_output = cache[mlp_post_name]
        attn_output = cache[attn_result_name] if attn_result_name in cache else None
        ln1_output = cache[ln1_name] if ln1_name in cache else None
        
        # remove batch dimension
        if mlp_output.dim() == 3:
            mlp_output = mlp_output[0]  # [seq_len, d_model]
        
        if attn_output is not None and attn_output.dim() == 3:
            attn_output = attn_output[0]
        
        if ln1_output is not None and ln1_output.dim() == 3:
            ln1_output = ln1_output[0]
        
        seq_len = mlp_output.shape[0]
        d_model = mlp_output.shape[-1]
        
        # determine which token positions to extract
        if token_positions is None:
            positions = list(range(seq_len))
        else:
            positions = [p for p in token_positions if 0 <= p < seq_len]
        
        mlp_data = []
        
        for token_idx in positions:
            # extract MLP output for this token
            mlp_vec = mlp_output[token_idx].cpu().numpy()  # [d_model]
            
            # calculate MLP statistics
            mlp_stats = {
                "mean": float(mlp_vec.mean()),
                "std": float(mlp_vec.std()),
                "max": float(mlp_vec.max()),
                "min": float(mlp_vec.min()),
            }
            
            # extract attention output (residual from attention head)
            attn_vec = None
            attn_stats = None
            if attn_output is not None:
                attn_vec = attn_output[token_idx].cpu().numpy()
                attn_stats = {
                    "mean": float(attn_vec.mean()),
                    "std": float(attn_vec.std()),
                    "max": float(attn_vec.max()),
                    "min": float(attn_vec.min()),
                }
            
            # calculate residual contribution (norm comparison)
            mlp_norm = float(torch.norm(mlp_output[token_idx]).item())
            residual_contribution = None
            
            if attn_output is not None:
                attn_norm = float(torch.norm(attn_output[token_idx]).item())
                residual_contribution = {
                    "mlp_norm": mlp_norm,
                    "attn_norm": attn_norm,
                    "ratio": mlp_norm / (attn_norm + 1e-10)
                }
            
            # neuron importance: which neurons have highest activation
            top_k = min(10, d_model)
            top_neuron_indices = torch.argsort(
                torch.abs(torch.tensor(mlp_vec))
            )[-top_k:].tolist()
            top_neuron_values = [float(mlp_vec[i]) for i in top_neuron_indices]
            
            mlp_data.append({
                "token_position": token_idx,
                "mlp_output": mlp_vec.tolist(),
                "mlp_statistics": mlp_stats,
                "attention_residual": attn_vec.tolist() if attn_vec is not None else None,
                "attention_statistics": attn_stats,
                "residual_contribution": residual_contribution,
                "top_neurons": {
                    "indices": top_neuron_indices,
                    "values": top_neuron_values
                }
            })
        
        return mlp_data


def extract_mlp(
    model: HookedTransformer,
    text: str,
    layer: int,
    token_positions: Optional[List[int]] = None
) -> Tuple[List[str], List[Dict]]:
    """
    Public interface for MLP extraction.
    
    Args:
        model: TransformerLens HookedTransformer model
        text: Input text to analyze
        layer: Layer index to extract from
        token_positions: Token positions to extract (None for all)
    
    Returns:
        Tuple of (tokens, mlp_data) where mlp_data is serializable.
    """
    extractor = MLPExtractor(model)
    return extractor.extract_mlp_and_residuals(text, layer, token_positions)
