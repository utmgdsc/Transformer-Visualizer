"use client"
import FlowArrow from "./FlowArrow"
import { useState, useEffect } from "react"

export default function Embedding({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {

  const [tokens, setTokens] = useState<string[]>([])
  const [embeddings, setEmbeddings] = useState<number[][]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [visibleDims, setVisibleDims] = useState(0)
  const [finished, setFinished] = useState(false)

  // Fetch embeddings
  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
      setEmbeddings([])
      setError(null)
      return
    }

    const tokenize = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            language: "en",
          }),
        })

        const data = await response.json()

        const filtered = data.token_embeddings.filter((te: any) =>
          typeof te.token === "string" &&
          te.token.trim() !== "" &&
          !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )

        setTokens(filtered.map((te: any) => te.token))
        setEmbeddings(filtered.map((te: any) => te.embedding.slice(0, 10)))
        setSelectedToken(0)

      } catch {
        setError("Failed to fetch embeddings")
        setTokens([])
        setEmbeddings([])
      } finally {
        setLoading(false)
      }
    }

    tokenize()
  }, [inputText])

  useEffect(() => {
    if (!embeddings[selectedToken]) return

    setVisibleDims(0)
    setFinished(false)

    let i = 0

    const interval = setInterval(() => {
      if (i >= embeddings[selectedToken].length) {
        clearInterval(interval)

        setTimeout(() => {
          setFinished(true)
        }, 300)

        return
      }

      setVisibleDims(prev => prev + 1)
      i++
    }, 60)

    return () => clearInterval(interval)
  }, [selectedToken, embeddings])

  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT */}
      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          CLICK A TOKEN TO INSPECT ITS EMBEDDING VECTOR
        </div>

        {loading && <div className="text-zinc-500 text-sm">Fetching embeddings...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

            {tokens.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedToken(i)}
                className={`min-w-[110px] px-4 py-2 rounded-lg border transition
                  ${
                    selectedToken === i
                      ? "bg-purple-600 border-purple-600 scale-105"
                      : "border-[#2a2a2e] hover:scale-105"
                  }
                `}
              >
                {t}
              </button>
            ))}

          </div>
        )}

        <FlowArrow />

        {tokens.length > 0 && !loading && (
          <div className="text-sm text-zinc-400 text-center">
            VECTOR FOR "{tokens[selectedToken].toUpperCase()}" — 768 DIMS, SHOWING 10
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-3xl">

          {embeddings.length > 0 &&
            embeddings[selectedToken] &&
            embeddings[selectedToken].map((v, i) => {

              const width = Math.abs(v) * 100
              const color = v >= 0 ? "bg-purple-500" : "bg-orange-400"

              return (
                <div
                  key={i}
                  className="flex items-center gap-4 transition-opacity duration-300"
                  style={{
                    opacity: i < visibleDims ? 1 : 0.2
                  }}
                >

                  <div className="w-16 text-zinc-400">
                    dim {i}
                  </div>

                  <div className="flex-1 h-4 bg-[#1c1c1f] rounded overflow-hidden">

                    <div
                      className={`h-4 rounded ${color} transition-all duration-300`}
                      style={{
                        width: i < visibleDims ? `${width}%` : "0%"
                      }}
                    />

                  </div>

                  <div className="w-12 text-right text-zinc-400">
                    {i < visibleDims ? v.toFixed(2) : ""}
                  </div>

                </div>
              )
            })}

        </div>

      </div>


      {/* RIGHT */}
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

          <div className="flex items-center gap-4 text-zinc-400 text-sm">

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>Positive dimensions</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-400" />
              <span>Negative dimensions</span>
            </div>

          </div>

        </div>

        <div className="flex justify-end mt-auto pt-6">

          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className={`border border-[#2a2a2e] px-5 py-2 rounded-lg transition
              ${
                finished
                  ? "bg-purple-600 text-white animate-pulse"
                  : "hover:bg-[#1c1c1f]"
              }
            `}
          >
            Next →
          </button>

        </div>

      </div>

    </div>
  )
}