# Hallucination Research for our Project

## Quick Summary

* SGI (Semantic Grounding Index): This checks if the AI is "grounded" in the text we gave it or if it's repeating the question. [1]
* Spectral Health (LapEigvals): A way to look at the AI's "brain waves" (attention maps) like a graph. If the math looks messy, the AI is probably confused. [2]
* Predictive Entropy: This measures the ai's "uncertainty meter." If the AI is uncertain on what word to pick next, it’s more likely to make something up. [3]
* LLM-as-a-Judge: We use a more advanced AI (like GPT-4) to grade our smaller model and explain exactly what it got wrong. [4]
* **Important Note**: You don't have to pick just one! We can use all of these together to show both the "internal" math and the "external" facts

## 1. Semantic Grounding Index (SGI) [1]

**The Idea**: This measures if the AI is being lazy. When an AI hallucinates, it usually stops looking at the source text and just sticks too close to the user's question. SGI uses math to see if the words the AI is picking are actually connected to the facts in the context

**How to build it**:

* Grab the embedding for the new token the LLM predicted
* Do the same for the question and the source text
* Use the Cosine Similarity formula to find the angle between these lists of numbers. A similarity of 1.0 means they are almost the same; 0.0 means they're totally different

* **The Visual**: We can use those histograms like Professor Guerzhoy mentioned [5]. If the bars are high for the source text, the AI is doing a good job. If the bars are low, it's probably hallucinating

## 2. Spectral Health (LapEigvals) [2]

**The Idea**: Think of the AI’s attention as a giant spider web connecting different words. If the web is strong and organized, the AI is thinking straight. But if the web looks like a tangled mess, it's a huge sign that it is hallucinating. We use eigenvalues to see if the LLM is hallucinating

**How to build it**:

* Pull the attention maps from GPT-2
* Turn that grid into a Laplacian Matrix
* Use a math library to find the Eigenvalues
* **The Visual**: Use a Spectral Sparkline (a tiny line graph). The graph shows these eigenvalue numbers for every word generated. If the line suddenly crashes or spikes, it means the "shape" of the AI's thoughts just broke, and we should show a warning

## 3. Predictive Entropy [3]

**The Idea**: Every time the AI picks a word, it has a list of possibilities. If it's 99% sure, the entropy is low. But if it's guessing between five different words and has no idea which one is right, the entropy is high. High entropy usually means the AI is hallucinating

**How to build it**:

* Grab the logits
* Use the Softmax function to turn those scores into percentages
* Use the Shannon Entropy formula ($H = -\sum p \log p$) to get the entropy
* **The Visual**: This is perfect for a Hallucination Heatmap**. We color the text background—white for low entropy (confident) and deep red for high entropy (guessing)

## 4. Using a more Advanced AI as a Judge [4]

**The Idea**: Since GPT-2 is an older, smaller model, it messes up a lot. We can use a "Judge AI" like GPT-4 to look at what GPT-2 wrote and compare it to the real facts. The advanced LLM can then give us a grade and explain the mistake in plain English

**How to build it**:

* Take the answer GPT-2 wrote and send it to an API (like OpenAI)
* Send a prompt like: "Here is the truth: [Source]. Here is what the AI said: [Output]. Is it a lie? Why?" (But ask it for a more structured response)
* Save the response
* **The Visual**: Build a "Why" Hover Tooltip. When a user hovers over a red word, a little box pops up with the Judge's explanation, like: "The model said 'Paris' but the source says 'London'."

---

**Final Note**: We can mix and match these however we want. We could have the **Heatmap** showing the AI's anxiety while the **Judge** explains the mistakes in a side panel. It makes the visualizer look way more professional!

### Sources:

[1] [Marín (2025), "Semantic Grounding Index: Geometric Bounds on Context Engagement in RAG Systems"](https://arxiv.org/abs/2512.13771)

[2] [Binkowski et al. (2024), "Hallucination Detection in LLMs Using Spectral Features of Attention Maps"](https://arxiv.org/abs/2502.17598)

[3] [Manakul et al. (2023), "SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models"](https://arxiv.org/abs/2303.08896)

[4] [Zheng et al. (2023), "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena"](https://arxiv.org/abs/2306.05685)

[5] [Zuo et al. (2025), "Position Information Emerges in Causal Transformers Without Positional Encodings via Similarity of Nearby Embeddings"](https://arxiv.org/abs/2501.00073v1) (This is the paper Professor Guerzhoy gave us as an example for histograms.)