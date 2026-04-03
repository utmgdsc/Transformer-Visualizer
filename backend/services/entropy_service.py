"""
Predictive Entropy Service: Measures model uncertainty during token generation.

This module calculates Shannon entropy from the model's output logits:
- Low entropy = Model is confident (good)
- High entropy = Model is guessing (possible hallucination)
"""

import torch
import torch.nn.functional as F
from typing import List, Tuple
from transformer_lens import HookedTransformer


class EntropyCalculator:
    """Computes predictive entropy for generated tokens."""
    
    def __init__(self, model: HookedTransformer):
        self.model = model
    
    def calculate_entropy(
        self,
        input_text: str,
        max_tokens: int = 50,
        temperature: float = 1.0
    ) -> Tuple[str, List[Tuple[str, float, List[float]]]]:
        """
        Calculate entropy for each generated token.
        
        Args:
            input_text: Input text to generate from
            max_tokens: Number of tokens to generate
            temperature: Sampling temperature
        
        Returns:
            Tuple of (generated_text, token_data) where token_data is a list of:
            (token, entropy, top_k_probs)
        """
        if temperature <= 0:
            raise ValueError(f"temperature must be > 0, got {temperature}")
        
        # tokenize input
        tokens = self.model.to_tokens(input_text)
        
        results = []
        generated_tokens = []
        
        with torch.no_grad():
            for _ in range(max_tokens):
                # get logits for next token
                logits = self.model(tokens)[0, -1, :]  # [vocab_size]
                
                # apply temperature
                logits = logits / temperature
                
                # calculate probabilities and entropy using numerically stable log_softmax
                log_probs = F.log_softmax(logits, dim=-1)
                probs = torch.exp(log_probs)
                
                # calculate Shannon entropy: H = -Σ(p * log(p))
                entropy = self._calculate_shannon_entropy_stable(log_probs, probs)
                
                # sample next token
                next_token_id = torch.multinomial(probs, num_samples=1)
                next_token = self.model.to_string(next_token_id.item())
                
                # get top 5 probabilities for context
                top_probs, _ = torch.topk(probs, k=5)
                top_probs_list = top_probs.tolist()
                
                # store results
                results.append((next_token, entropy, top_probs_list))
                generated_tokens.append(next_token)
                
                # append token for next iteration (ensure shape matches [1, seq_len])
                tokens = torch.cat([tokens, next_token_id.unsqueeze(0)], dim=1)
        
        generated_text = "".join(generated_tokens)
        return generated_text, results
    
    def _calculate_shannon_entropy(self, probs: torch.Tensor) -> float:
        """
        Calculate Shannon entropy: H = -Σ(p * log(p)) (DEPRECATED - use _calculate_shannon_entropy_stable)
        
        Args:
            probs: Probability distribution over vocabulary
        
        Returns:
            Entropy value (higher = more uncertain)
        """
        # avoid log(0) by filtering out zero probabilities
        non_zero_probs = probs[probs > 0]
        
        # Shannon entropy formula
        entropy = -(non_zero_probs * torch.log(non_zero_probs)).sum()
        
        return entropy.item()
    
    def _calculate_shannon_entropy_stable(self, log_probs: torch.Tensor, probs: torch.Tensor) -> float:
        """
        Calculate Shannon entropy using numerically stable log_softmax: H = -Σ(p * log(p))
        
        Args:
            log_probs: Log probabilities from F.log_softmax (more stable)
            probs: Probabilities from torch.exp(log_probs)
        
        Returns:
            Entropy value (higher = more uncertain)
        """
        # Shannon entropy using stable log probabilities
        entropy = -(probs * log_probs).sum()
        return entropy.item()
    
    @staticmethod
    def calculate_entropy_from_logits(logits: torch.Tensor, temperature: float = 1.0) -> float:
        """
        Static method to calculate entropy from raw logits (for use in other modules).
        
        Args:
            logits: Raw model logits
            temperature: Temperature scaling (must be > 0)
            
        Returns:
            Shannon entropy value
        """
        if temperature <= 0:
            raise ValueError(f"temperature must be > 0, got {temperature}")
        
        # Apply temperature scaling
        scaled_logits = logits / temperature
        
        # Use numerically stable log_softmax
        log_probs = F.log_softmax(scaled_logits, dim=-1)
        probs = torch.exp(log_probs)
        
        # Calculate Shannon entropy
        entropy = -(probs * log_probs).sum()
        return entropy.item()
    
    def classify_entropy_level(self, entropy: float, max_entropy: float = 10.0) -> str:
        """
        Classify entropy into low/medium/high confidence levels.
        
        Args:
            entropy: Calculated entropy value
            max_entropy: Maximum expected entropy (for normalization)
        
        Returns:
            Classification: "low", "medium", or "high"
        """
        # normalize entropy to 0-1 range
        normalized = min(entropy / max_entropy, 1.0)
        
        if normalized < 0.3:
            return "low"  # confident
        elif normalized < 0.7:
            return "medium"  # somewhat uncertain
        else:
            return "high"  # very uncertain (possible hallucination)
