# Multilingual support for Transformer Visualizer

To generalize, for different langauges, we have to:
1. in src/utils/model, change modelname to the model we want to use for all the files (~3-4 files)
2. we would have to use a separate tokenizer too (usually included in the Transformers library)
    1. in src/routes/+page.svelte, change the tokenizer. for latin languages (i.e Spanish), usually just changing in the frontend is enough
    2. if we are using a non-latin language such as Arabic, in src/utils/data.ts , change the tokenizer here too!
    3. probably safe if we change both in backend and frontend for consistency

For all languages, we would need to use GPT-small models.

## Arabic
https://huggingface.co/aubmindlab/aragpt2-base
tokenizer = AutoTokenizer.from_pretrained("aubmindlab/aragpt2-base")
model = AutoModelForCausalLM.from_pretrained("aubmindlab/aragpt2-base")

## Spanish
https://huggingface.co/datificate/gpt2-small-spanish 
tokenizer = AutoTokenizer.from_pretrained("datificate/gpt2-small-spanish")
model = AutoModelForCausalLM.from_pretrained("datificate/gpt2-small-spanish")


## Javanese
https://huggingface.co/w11wo/javanese-gpt2-small
tokenizer = AutoTokenizer.from_pretrained("w11wo/javanese-gpt2-small")
model = AutoModelForCausalLM.from_pretrained("w11wo/javanese-gpt2-small")

## Dutch
https://huggingface.co/GroNLP/gpt2-small-dutch
tokenizer = AutoTokenizer.from_pretrained("GroNLP/gpt2-small-dutch")
model = AutoModelForCausalLM.from_pretrained("GroNLP/gpt2-small-dutch")