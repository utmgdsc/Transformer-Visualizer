"use client"

import { useEffect, useState } from "react"
import FlowArrow from "./FlowArrow"

export default function TokenizationScreen({
  stepIndex,
  setStepIndex,
  inputText,
  runSignal,
  language
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
  runSignal: number
  language: string
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
          body: JSON.stringify({ text: inputText, language: language })
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
        setLatestIndex(next.length - 1)
        return next
      })

      i++

    }, 400)

    return () => clearInterval(interval)
  }, [tokens, runSignal])


  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT SIDE (UNCHANGED) */}
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

      <div className="bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-6">

        {/* HEADER */}
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">
            Tokenization
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Text is broken into smaller units called tokens that the model can process.
          </div>
        </div>

        {/* WHAT TOKENS ARE */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            What is a Token?
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Tokens can be full words, subwords, or even punctuation.  
            For example:
          </div>
          <div className="font-mono text-xs text-zinc-400 mt-2">
            "empowers" → ["em", "powers"]
          </div>
        </div>

        {/* VOCAB */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            Vocabulary
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            GPT-2 uses a fixed vocabulary of:
          </div>
          <div className="font-mono text-xs text-zinc-400 mt-1">
            50,257 tokens
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            This vocabulary is learned before training and reused for all inputs.
          </div>
        </div>

        {/* WHY IT MATTERS */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            Why Tokenization Matters
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Tokens are the bridge between raw text and math — they allow language to be converted into vectors that neural networks can process.
          </div>
        </div>

        {/* TRANSITION */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            Next Step
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Each token will be mapped to an ID, which is then used to retrieve its embedding vector.
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-auto flex justify-end">
          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className={`px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] transition ${
              finished
                ? "bg-purple-600 text-white animate-pulse"
                : "text-zinc-400 hover:bg-[#1a1a20]"
            }`}
          >
            Next →
          </button>
        </div>

      </div>

    </div>
  )
}