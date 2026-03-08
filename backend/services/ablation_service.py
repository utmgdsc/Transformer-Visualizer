"""
Ablation Service: Modifies model weights/activations during inference.

This module provides functionality to:
1. Zero-ablate specific attention heads or layers
2. Scale activations by a factor
3. Apply mean ablation
4. Run controlled experiments comparing ablated vs baseline generations
"""

import torch
from typing import Optional, Tuple, Callable
from transformer_lens import HookedTransformer
from transformer_lens.hook_points import HookPoint


class AblationManager:
    """Manages activation modifications during model inference."""
    
    def __init__(self, model: HookedTransformer):
        self.model = model
        self.hooks = []
    
    def generate_with_ablation(
        self,
        text: str,
        ablation_type: str,
        target_layer: int,
        target_head: Optional[int],
        scale_factor: float,
        max_tokens: int,
        temperature: float
    ) -> Tuple[str, str]:
        """
        Generate text with ablation applied and return comparison.
        
        Args:
            text: Input text
            ablation_type: Type of ablation ("zero", "mean", "scale")
            target_layer: Layer to ablate
            target_head: Head to ablate (None for entire layer)
            scale_factor: Scaling factor for scale ablation
            max_tokens: Number of tokens to generate
            temperature: Sampling temperature
        
        Returns:
            Tuple of (ablated_text, baseline_text)
        """
        # generate baseline first (no ablation)
        baseline_text = self._generate_text(text, max_tokens, temperature)
        
        # create ablation hook
        hook_fn = self._create_ablation_hook(
            ablation_type, target_layer, target_head, scale_factor
        )
        
        # generate with ablation
        ablated_text = self._generate_text(
            text, max_tokens, temperature, hooks=[(self._get_hook_name(target_layer), hook_fn)]
        )
        
        return ablated_text, baseline_text
    
    def _create_ablation_hook(
        self,
        ablation_type: str,
        target_layer: int,
        target_head: Optional[int],
        scale_factor: float
    ) -> Callable:
        """Create a hook function for the specified ablation type."""
        
        if ablation_type == "zero":
            return self._zero_ablation_hook(target_head)
        elif ablation_type == "mean":
            return self._mean_ablation_hook(target_head)
        elif ablation_type == "scale":
            return self._scale_ablation_hook(target_head, scale_factor)
        else:
            raise ValueError(f"Unknown ablation type: {ablation_type}")
    
    def _zero_ablation_hook(self, target_head: Optional[int]) -> Callable:
        """Create hook that zeros out attention patterns."""
        def hook(attention: torch.Tensor, hook: HookPoint) -> torch.Tensor:
            # shape: [batch, n_heads, seq_len, seq_len]
            if target_head is not None:
                # ablate specific head: set all attention values to 0
                attention[:, target_head, :, :] = 0.0
            else:
                # ablate entire layer: zero out all attention
                attention[:] = 0.0
            return attention
        return hook
    
    def _mean_ablation_hook(self, target_head: Optional[int]) -> Callable:
        """Create hook that replaces attention patterns with uniform distribution."""
        def hook(attention: torch.Tensor, hook: HookPoint) -> torch.Tensor:
            # shape: [batch, n_heads, seq_len, seq_len]
            if target_head is not None:
                # replace head attention with uniform distribution
                seq_len = attention.shape[-1]
                uniform_attn = torch.ones_like(attention[:, target_head, :, :]) / seq_len
                attention[:, target_head, :, :] = uniform_attn
            else:
                # replace entire layer with uniform attention
                seq_len = attention.shape[-1]
                uniform_attn = torch.ones_like(attention) / seq_len
                attention[:] = uniform_attn
            return attention
        return hook
    
    def _scale_ablation_hook(self, target_head: Optional[int], scale: float) -> Callable:
        """Create hook that scales attention patterns by a factor."""
        def hook(attention: torch.Tensor, hook: HookPoint) -> torch.Tensor:
            # shape: [batch, n_heads, seq_len, seq_len]
            if target_head is not None:
                # scale specific head's attention
                attention[:, target_head, :, :] *= scale
            else:
                # scale entire layer's attention
                attention[:] *= scale
            return attention
        return hook
    
    def _get_hook_name(self, layer: int) -> str:
        """Get the hook point name for attention pattern at specified layer."""
        return f"blocks.{layer}.attn.hook_pattern"
    
    def _generate_text(
        self,
        text: str,
        max_tokens: int,
        temperature: float,
        hooks: Optional[list] = None
    ) -> str:
        """Generate text with optional hooks applied."""
        tokens = self.model.to_tokens(text)
        generated_tokens = tokens.clone()
        
        # apply hooks if provided
        if hooks:
            for hook_name, hook_fn in hooks:
                self.model.add_hook(hook_name, hook_fn)
        
        try:
            # generate tokens one at a time
            for _ in range(max_tokens):
                with torch.no_grad():
                    logits = self.model(generated_tokens)
                
                # sample next token
                final_logits = logits[0, -1, :]
                probs = torch.softmax(final_logits / temperature, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
                generated_tokens = torch.cat(
                    [generated_tokens, next_token.unsqueeze(0)], dim=1
                )
            
            return self.model.to_string(generated_tokens[0])
        
        finally:
            # always remove hooks after generation
            if hooks:
                self.model.reset_hooks()


def generate_with_ablation(
    model: HookedTransformer,
    text: str,
    ablation_type: str,
    target_layer: int,
    target_head: Optional[int],
    scale_factor: float,
    max_tokens: int,
    temperature: float
) -> Tuple[str, str]:
    """
    Public interface for ablated generation.
    
    Args:
        model: TransformerLens HookedTransformer model
        text: Input text
        ablation_type: Type of ablation ("zero", "mean", "scale")
        target_layer: Layer to ablate
        target_head: Head to ablate (None for entire layer)
        scale_factor: Scaling factor for scale ablation
        max_tokens: Number of tokens to generate
        temperature: Sampling temperature
    
    Returns:
        Tuple of (ablated_text, baseline_text) for comparison.
    """
    manager = AblationManager(model)
    return manager.generate_with_ablation(
        text, ablation_type, target_layer, target_head,
        scale_factor, max_tokens, temperature
    )
