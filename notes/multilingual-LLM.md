# Language Support in Transformer Lens

## Quick Summary
- TransformerLens just uses model weights as-is;it doesn't modify how the model handles multilingualism, it just lets you inspect it!
- MWork: LLMs process non-English input in three stages: convert to English-centric representations --> reason in English --> convert back to original language
    - It's not actual translation
    - Self-attention handles reasoning (English-centric), FFNs handle factual knowledge retrieval (multilingual), these are separable
    - Just 0.13% of neurons being deactivated can destroy multilingual capabilities entirely. This shows how concentrated the language-switching work is
- Neuron behaviour is input dependent, not fixed. A "language-specific" neuron per MWork might behave differently on a different input.
    - All-shared neurons (~20% in BLOOM) do ~91% of the work for correct outputs. Language-specific neurons mostly handle surface-level switching
    - Reasoning tasks activate more all-shared neurons, fact retrieval activates more partial-shared.
    - BLOOM-560m likely has even fewer all-shared neurons than base BLOOM since it lacks IFT (instruction fine-tuning), meaning more language-specific behaviour and weaker multilingual alignment. Since fact retrieval uses partial-shared neurons, which means language-dependant, what the model retrives may be differ per language
    - The model doesn't work harder for one language vs another; same number of neurons fire, just different ones


## Transformer Lens
Transformer Lens works by using an already-trained model and "reverse engineer the algorithms the model learned during training from its weights". [1]
So basically, Transformer Lens doesn't deal with how the models interact with multilinguism directly, but rather it just uses the model's weights and information; it doesn't do any of the modifcation.

## MWork - Multilingual Workflow [2]
High-level: translate to English-centric (not exactly English) --> reason/task-solving (English-centric + some non-English tokens) --> translate back to the original language
LLMs used: Mistral, Vicuna, BLOOMZ, Chinese Llama

The authors hypothesize that the process, known as MWork, is how multilingual models work. 
They test the hypothesis using PLND (Parallel Language-specific Neuron Detection), which finds language-specific neurons that are consistently activated when processing documents in a specific language. 
- They feed the LLM a corpus of a certain language, then identify neurons that are activated. Using these neurons, they test whether these neurons are truly language-specific by deactivating them and assess the performance.
- They found that even if they deactivate just 0.13% of those language-specific neurons, the LLMs "lose their nultilingual capabilities". And only 0.1% of the neurons are language-specific. 

The workflow is as follows:
- Understanding the input by "unifying diverse linguistic features"
- Task-solving phase, decomposed into two parts: reasoning in English via self-attention, and extracting multilingual knowledge via feed-forward networks.
    - FFNs are useful for hallucination detection, since knowledge retrieval is from FFN. 
- Generating back to the original language

For deactivating neurons, they compared deactivating language-specific neurons vs randomly chosen neurons. They also considered the position of the neurons, AKA the layer (task-solving layer, generation layer, etc).  

They found that deactivating randomly sampled neurons barely affects the performance of LLMs, for both English and non-English. They have also found that it sometimes improves the performance, because the random sample contains neurons that are irrelevant. 
- if these random neurons are deactivated in the understanding layer however, the performances diverge slightly, where English performs better. 

However, when deactivating language-specific neurons, it doesn't affects English as much, but there is a significant drop in performance for non-English languages. 
- in understanding layer, it hurts non-english a lot but not so much for english. this is likely because english doesn't need that conversion from language --> english-centric, and therefore doesn't get affected as much. it essentially loses its translator.
- in task-solving, both are affected since the model is reasoning at this stage, in English.
- in the generation layer, it doesn't affect either. Deactivating all language-specific neurons causes the multilingual generation to break completely (model can't produce non-English output anymore) but deactivating only the non-English language-specific neurons hurts the generation but is not completely gone.  

## How LLMs distinguish langauges [3]
High-level: How much (FFN) neurons are shared across languages, and how much they contribute to the output.
LLMs used: BLOOM, BLOOMZ (this is what our Visualizer uses too)

There exists four types of neurons in FFNs (feed-forward network, which represent semantic features):
- All-shared: remain active for all inputs regardless of language
- Partial-shared: activated only for certain languages
- Specific: active for exactly one language
- Non-activated: dead for all languages

These properties of neurons aren't fixed, rather they depend on the given input and its semantics. So, the neurons may not be language specific. It's also interesting to note that less than 10% of inactive neurons stay inactive across all inputs, so neurons PLND identifies as language-specific in MWork might not be permanent; they're more dynamic than what MWork mentions.

So in MWork, where they split task-solving into reasoning (english-centric) and fact retrieval (FFN, multilingual), all-shared dominates in reasoning, and partial-shared dominates in fact retrieval. 
- Fact probing: more partial-shared neurons, which means retrieving facts is language dependant! "Who is the president of France" in French vs English might pull from overlapping but not identical neuron sets because factual knowledge is stored multilingually in the FFNs. 
- There are more all-shared in lower levels, and fewer of these in the upper layers imply language-specific characteristics exist there. There are more partial-shared here in the upper layers. This means the model adapts at the neuron level depending on what kind of task it's doing. Reasoning uses all-shared, but knowledge tasks stay more language-specific. 

Also, they found that the model is doing roughly the same amount of work per layer for any language. The difference between languages isn't how many neurons are activated, it's which neurons. So, the model doesn't work harder for English compared to French; it's the neurons it's using!

Although all-shared only makes up of ~20% of neurons in BLOOM (~30% in BLOOMZ, BLOOM-560m, the model we're using may have a lower percentage since it doesn't have IFT), regardless the language inputs, all-shared neurons are the top contributing neurons to the outputs at every layer. Specifically, "they contribute 91.6% to the generation of the correct output in the German test set". So, language-specific neurons are more about surface-level switching than actual correctness.
- They then propose at the end that increasing all-shared neurons (via replacing or IFT, instruction fine-tuning) can "significantly enhance the accuracy of an LLM in multilingual tasks."


### another paper to explore (if time permits): https://arxiv.org/pdf/2502.15603

Sources: \
[1] https://transformerlensorg.github.io/TransformerLens/ \
[2] https://arxiv.org/pdf/2402.18815 \
[3] https://arxiv.org/pdf/2406.09265v1


