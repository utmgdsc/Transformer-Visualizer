from fastapi import APIRouter, HTTPException

from models.model_loader import model_manager
from schemas import MLPRequest, MLPResponse, MLPOutput, TopNeuron
from services.mlp_service import extract_mlp

router = APIRouter(prefix="/v1", tags=["mlp"])


@router.post("/mlp", response_model=MLPResponse)
async def get_mlp_outputs(request: MLPRequest):
    """
    Extract MLP (feed-forward) layer outputs and residual information.
    
    The MLP layer processes token representations through two feed-forward networks,
    and residuals show how information flows through the transformer block.
    
    Includes:
    - MLP output vectors for each token
    - Attention residuals (output from attention heads)
    - Residual contribution analysis (how much each component affects output)
    - Top neuron activations (which neurons fire most strongly)
    """
    # check if model is loaded
    if not model_manager.is_loaded(request.language):
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_manager.get_model(request.language)
    
    try:
        # validate layer
        if request.layer < 0 or request.layer >= model.cfg.n_layers:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid layer. Must be between 0 and {model.cfg.n_layers - 1}"
            )
        
        # extract MLP data using service layer
        tokens, mlp_data = extract_mlp(
            model=model,
            text=request.text,
            layer=request.layer,
            token_positions=request.token_positions
        )
        
        # convert to response format
        mlp_outputs = []
        for m in mlp_data:
            top_neurons = [
                TopNeuron(index=idx, value=val)
                for idx, val in zip(m["top_neurons"]["indices"], m["top_neurons"]["values"])
            ]
            
            mlp_outputs.append(MLPOutput(
                token_position=m["token_position"],
                mlp_output=m["mlp_output"],
                mlp_mean=m["mlp_statistics"]["mean"],
                mlp_std=m["mlp_statistics"]["std"],
                mlp_max=m["mlp_statistics"]["max"],
                mlp_min=m["mlp_statistics"]["min"],
                attention_residual=m["attention_residual"],
                attention_mean=m["attention_statistics"]["mean"] if m["attention_statistics"] else None,
                attention_std=m["attention_statistics"]["std"] if m["attention_statistics"] else None,
                residual_contribution=m["residual_contribution"],
                top_neurons=top_neurons
            ))
        
        return MLPResponse(
            input_text=request.text,
            tokens=tokens,
            layer=request.layer,
            mlp_outputs=mlp_outputs
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"MLP extraction failed: {str(e)}"
        )
