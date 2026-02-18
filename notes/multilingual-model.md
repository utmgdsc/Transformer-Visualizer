# Multilingual support for Transformer Visualizer

To generalize, for different langauges, we have to:
1. In the backend (for Transformer Explainer, src/utils/model, change `modelname`), export the model to ONNX if we want to run on the browser. If not, and if we want to do everything in the backend, use AutoModelForCausalLM . 
2. we would have to use a separate tokenizer too using AutoTokenizer (usually included in the Transformers library)
    1. In frontend: (i.e. src/routes/+page.svelte), change the tokenizer.
    2. in the backend (i.e. src/utils/data.ts), change the tokenizer here. 
    3. Change these tokenizers dynamically based on the model the user chooses. We could do this using a model registry, by having a list of dictionaries, each dictionary containing information for a model (name, model, tokenizer, etc). 
3. If using ONNX, load the ONNX model weights, and visualization logic remains unchanged.

For any language we choose to do, we would need to use GPT-2 small (same hidden size, number of layers, etc.) models.

## Arabic
https://huggingface.co/aubmindlab/aragpt2-base \
tokenizer = AutoTokenizer.from_pretrained("aubmindlab/aragpt2-base") \
model = AutoModelForCausalLM.from_pretrained("aubmindlab/aragpt2-base")

Since Arabic uses non-latin alphabet and has different sentence structure (i.e. right-to-left instead of left-to-right), we would also have to modify the frontend display to reflect the changes.

## Spanish
https://huggingface.co/datificate/gpt2-small-spanish \
tokenizer = AutoTokenizer.from_pretrained("datificate/gpt2-small-spanish") \
model = AutoModelForCausalLM.from_pretrained("datificate/gpt2-small-spanish")


## Javanese
https://huggingface.co/w11wo/javanese-gpt2-small \
tokenizer = AutoTokenizer.from_pretrained("w11wo/javanese-gpt2-small") \
model = AutoModelForCausalLM.from_pretrained("w11wo/javanese-gpt2-small")

## Dutch
https://huggingface.co/GroNLP/gpt2-small-dutch \
tokenizer = AutoTokenizer.from_pretrained("GroNLP/gpt2-small-dutch") \
model = AutoModelForCausalLM.from_pretrained("GroNLP/gpt2-small-dutch")

### Changes we would have to make to Transformer Explainer
Not much, other than changing the tokenizer, model, and ONNX weights. Everything else is pretty much the same. 