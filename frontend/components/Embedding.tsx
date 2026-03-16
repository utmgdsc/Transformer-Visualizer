"use client"
import FlowArrow from "./FlowArrow"
import { useState } from "react"

export default function Embedding({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {

  // tokens from user input
  const tokens =
    inputText.trim().length > 0
      ? inputText.split(/\s+/)
      : []

  const [selectedToken, setSelectedToken] = useState(0)

  // fake deterministic embedding generator
  function generateEmbedding(token: string) {
    let seed = 0
    for (let i = 0; i < token.length; i++) {
      seed += token.charCodeAt(i)
    }

    return Array.from({ length: 10 }, (_, i) => {
      const x = Math.sin(seed * (i + 1)) * 0.9
      return parseFloat(x.toFixed(2))
    })
  }

  const embedding =
    tokens.length > 0
      ? generateEmbedding(tokens[selectedToken])
      : []

  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          CLICK A TOKEN TO INSPECT ITS EMBEDDING VECTOR
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

          {tokens.map((t,i)=>(
            <button
              key={i}
              onClick={()=>setSelectedToken(i)}
              className={`min-w-[110px] px-4 py-2 rounded-lg border ${
                selectedToken === i
                ? "bg-purple-600 border-purple-600"
                : "border-[#2a2a2e]"
              }`}
            >
              {t}
            </button>
          ))}

        </div>

        <FlowArrow />

        {tokens.length > 0 && (
          <div className="text-sm text-zinc-400 text-center">
            VECTOR FOR "{tokens[selectedToken].toUpperCase()}" — 768 DIMS, SHOWING 10
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-3xl">

          {embedding.map((v,i)=>{

            const width = Math.abs(v) * 100
            const color = v >= 0 ? "bg-purple-500" : "bg-orange-400"

            return (
              <div key={i} className="flex items-center gap-4">

                <div className="w-16 text-zinc-400">
                  dim {i}
                </div>

                <div className="flex-1 h-4 bg-[#1c1c1f] rounded">
                  <div
                    className={`h-4 rounded ${color}`}
                    style={{width:`${width}%`}}
                  />
                </div>

                <div className="w-12 text-right text-zinc-400">
                  {v.toFixed(2)}
                </div>

              </div>
            )

          })}

        </div>

      </div>


      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">
            Embeddings
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            A learned matrix converts each ID into a dense vector. Similar words end up
            with similar vectors.
          </p>

          <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
            E = Lookup(id) <br/>
            X ∈ ℝ^(n×768)
          </div>

          <div className="border-l-2 border-purple-500 pl-4 text-zinc-400 text-sm">
            Purple bars = positive dims, orange = negative. Intensity shows magnitude.
          </div>

        </div>

        <div className="flex justify-end mt-auto pt-6">

          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className="border border-[#2a2a2e] px-5 py-2 rounded-lg hover:bg-[#1c1c1f]"
          >
            Next →
          </button>

        </div>

      </div>

    </div>

  )
}