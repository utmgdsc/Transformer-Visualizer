"use client"

import { useEffect, useState } from "react"
import FlowArrow from "./FlowArrow"

export default function TokenIDScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {

  const [tokens, setTokens] = useState<string[]>([])
  const [tokenIDs, setTokenIDs] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentStep, setCurrentStep] = useState(-1)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
      setTokenIDs([])
      return
    }

    const tokenize = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language: "en" })
        })

        const data = await res.json()

        const filtered = data.token_embeddings.filter((te: any) =>
          typeof te.token === "string" &&
          te.token.trim() !== "" &&
          !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )

        setTokens(filtered.map((te: any) => te.token))
        setTokenIDs(filtered.map((te: any) => te.token_id))

      } catch {
        setError("Tokenization failed")
        setTokens([])
        setTokenIDs([])
      } finally {
        setLoading(false)
      }
    }

    tokenize()
  }, [inputText])

 
  useEffect(() => {
    if (tokenIDs.length === 0) return

    setCurrentStep(-1)
    setFinished(false)

    let i = 0

    const interval = setInterval(() => {
      if (i >= tokenIDs.length) {
        clearInterval(interval)

        setTimeout(() => setFinished(true), 250)
        return
      }

      setCurrentStep(i)
      i++
    }, 700)

    return () => clearInterval(interval)
  }, [tokenIDs])

  const filledRows =
    currentStep >= 0
      ? Array.from({ length: currentStep + 1 }, (_, i) => i)
      : []

  const activeIndex = currentStep

  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT */}
      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          EACH TOKEN IS GIVEN A UNIQUE ID THAT CORRESPONDS TO A ROW IN THE EMBEDDING MATRIX
        </div>

        {loading && <div className="text-zinc-500 text-sm">Tokenizing...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

            {tokens.map((token, i) => (
              <div
                key={i}
                className={`min-w-[120px] px-5 py-3 border rounded-lg flex flex-col items-center transition
                  ${
                    i === activeIndex
                      ? "border-purple-500 bg-purple-900/40 scale-105"
                      : "border-[#2a2a2e]"
                  }
                `}
              >
                <div className="text-zinc-300">{token}</div>
                <div className="text-lg font-semibold">
                  {tokenIDs[i] ?? "-"}
                </div>
              </div>
            ))}

          </div>
        )}

        {/* FLOW */}
        <div className="flex flex-col items-center gap-4">

          <FlowArrow />

          <div className="text-sm text-zinc-400 text-center">
            These IDs index into the embedding matrix
          </div>

          <div className="bg-[#151517] border border-[#2a2a2e] rounded-lg p-4 flex flex-col gap-2">

            <div className="text-xs text-zinc-500 mb-2">
              Embedding Matrix (~50k × 768) — showing a tiny slice
            </div>

            {filledRows.map((i) => {
              const id = tokenIDs[i]
              if (id === undefined) return null 

              return (
                <div
                  key={`${id}-${i}`}
                  className="flex items-center gap-3 p-2 rounded bg-purple-700/40 scale-105 transition"
                >
                  <div className="w-20 text-zinc-400 text-sm">
                    row {id}
                  </div>

                  <div className="flex gap-1">
                    {[...Array(8)].map((_, j) => (
                      <div
                        key={j}
                        className="w-5 h-4 rounded bg-purple-400"
                      />
                    ))}
                  </div>

                  <div className="text-xs text-zinc-500 ml-2">
                    ...768 dims
                  </div>
                </div>
              )
            })}

          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">
            Token IDs
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Each token maps to an integer index in the vocabulary (~100k tokens).
          </p>

          {activeIndex >= 0 && (
            <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
              "{tokens[activeIndex]}" → {tokenIDs[activeIndex]}
            </div>
          )}

          <div className="border-l-2 border-purple-500 pl-4 text-zinc-400 text-sm">
            These IDs select a row in the embedding matrix.
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