# TransformerVisualizer

An educational platform inspired by Transformer Explainer, built by Amaan Farooqi, Anas Almasri, Fares Alkorani, Joshua Ramnauth, and Rithika Yerra as part of CSC392H5 at the University of Toronto Mississauga, under the supervision of Professor Mohammad Mahmoud.

It can be viewed here : https://transformer-visualizer-eight.vercel.app/

## About The Project


Transformer Visualizer is an interactive tool for exploring transformer model internals, including attention patterns, token activations, and layer representations across English, French, and Chinese. It is built on GPT-2 and BLOOM-560M and includes hallucination detection metrics.


### Built With
* [![Next.js][Next.js-badge]][Next-url]
* [![React][React-badge]][React-url]
* [![FastAPI][FastAPI-badge]][FastAPI-url]
* [![TransformerLens][TransformerLens-badge]][TransformerLens-url]


[Next.js-badge]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org


[React-badge]: https://img.shields.io/badge/react-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org


[FastAPI-badge]: https://img.shields.io/badge/fastapi-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com


[TransformerLens-badge]: https://img.shields.io/badge/TransformerLens-grey?style=for-the-badge
[TransformerLens-url]: https://github.com/TransformerLensOrg/TransformerLens





## Getting Started
To get a local copy up and running, follow these simple steps.

### Prerequisites
Make sure you have the following installed:
* Python 3.8+ & pip
* Node.js & npm
```sh
  npm install npm@latest -g
```

### Installation
_Get your API key from Groq and follow the steps below to set up the project._

1. Get a free API Key at [https://console.groq.com/keys](https://console.groq.com/keys)

2. Clone the repo
```sh
   git clone https://github.com/utmgdsc/Transformer-Visualizer.git
```

3. Install backend dependencies
```sh
   pip install -r requirements.txt
```
4. Install frontend NPM packages
```sh
   cd frontend
   npm install
```
5. Create a `.env` file and add your API key
```env
   GROQ_API_KEY='ENTER YOUR API KEY'
```
6. Change git remote url to avoid accidental pushes to base project
```sh
   git remote set-url origin github_username/repo_name
   git remote -v
```


## Running Locally

You'll need two terminals — one for the backend and one for the frontend.

**Start the backend:**
```sh
cd backend
uvicorn main:app --reload
```

**Start the frontend:**
```sh
cd frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> Make sure your `.env` file is set up with your Groq API key before starting the backend.


## Usage

1. Enter any text into the input bar at the top and click **Run**

2. Step through each stage of the transformer pipeline using the **Next** button or by clicking any step in the left sidebar:

   - **Tokenization** — see how your text is split into tokens

   - **Token IDs** — view the unique ID assigned to each token and its row in the embedding matrix

   - **Embeddings** — explore the vector representation of each token

   - **QKV** — understand how Query, Key, and Value matrices are computed

   - **Self-Attention** — click any token to see which other tokens it attends to, and switch between heads using the head navigator
   - **Attention Out** — view the output of the attention mechanism

   - **MLP** — see how each token's representation is refined through the feedforward layers

   - **Calculating the Probabilities** — visualize the final linear projection and softmax that produces next-token probabilities

   - **Output** — see the model's predicted next token

3. Use the **layer navigator** (top right) to move between the 12 transformer layers and compare how representations evolve

4. Switch the language using the **language dropdown** at the top

---

### Screenshots


#### Tokenization
![Tokenization](./notes/tokenizationScreen.png)

#### Embeddings
![Embeddings](./notes/embeddingScreen.png)

#### Self-Attention
![Self-Attention](./notes/selfAttentionScreen.png)

#### Calculating Probabilities
![Probabilities](./notes/calculatingProbScreen.png)

#### Output With Hallucination Metric
![Output](./notes/outputScreen.png)



## License

Distributed under the MIT License.


---

## Acknowledgements

* Inspired by [Transformer Explainer](https://poloclub.github.io/transformer-explainer/)
* [TransformerLens](https://github.com/TransformerLensOrg/TransformerLens)
* [Groq](https://groq.com)


