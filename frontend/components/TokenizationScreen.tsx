"use client"

import { useEffect, useState } from "react"
import FlowArrow from "./FlowArrow"

export default function TokenizationScreen({
  stepIndex,
  setStepIndex,
  inputText,
  runSignal
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
  runSignal: number
}) {

  const [tokens, setTokens] = useState<string[]>([])
  const [visibleTokens, setVisibleTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const [latestIndex, setLatestIndex] = useState(-1)

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
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

        const cleaned = data.token_embeddings
          .map((t: any) => t.token)
          .filter((t: any) => typeof t === "string" && t.trim() !== "")

        setTokens(cleaned)

      } catch {
        setError("Tokenization failed")
        setTokens([])
      } finally {
        setLoading(false)
      }
    }

    tokenize()
  }, [runSignal])

  useEffect(() => {
    if (tokens.length === 0) return

    setVisibleTokens([])
    setFinished(false)
    setLatestIndex(-1)

    let i = 0

    const interval = setInterval(() => {

      if (i >= tokens.length) {
        clearInterval(interval)
        setFinished(true)
        return
      }

      setVisibleTokens(prev => {
        const next = [...prev, tokens[i]]

        // mark newest token
        setLatestIndex(next.length - 1)

        return next
      })

      i++

    }, 400)

    return () => clearInterval(interval)
  }, [tokens, runSignal])


  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT SIDE */}
      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-500 text-sm w-full text-left">
          INPUT TEXT
        </div>

        <div className="italic text-3xl text-zinc-200 text-center max-w-3xl">
          "{inputText}"
        </div>

        <FlowArrow />

        <div className="text-zinc-400 text-sm text-center">
          TOKENS ({Math.max(visibleTokens.length - 1, 0)})
        </div>

        {loading && (
          <div className="text-zinc-500 text-sm">
            Tokenizing...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

          {visibleTokens.map((token, i) => {
            if (!token) return null

            const isNew = i === latestIndex

            return (
              <div
                key={i}
                className={`min-w-[110px] px-4 py-2 border rounded-lg text-center transition
                  border-[#2a2a2e]
                  ${isNew ? "animate-tokenPop border-purple-500" : ""}
                `}
              >
                {token}
              </div>
            )
          })}

        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col gap-4">

        <h2 className="text-xl font-semibold">
          Tokenization
        </h2>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Your text is split into tokens, the basic units the model reads.
        </p>

        <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
          Input → [t1, t2, … t{visibleTokens.length - 1}]
        </div>

        <div className="flex justify-end pt-6">

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