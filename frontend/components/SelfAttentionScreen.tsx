"use client"

import { useState, useEffect } from "react"
import FlowArrow from "./FlowArrow"

export default function SelfAttentionScreen({
  stepIndex,
  setStepIndex,
  inputText,
  layer
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
  layer: number
}) {

  const [tokens, setTokens] = useState<string[]>([])
  const [attentionMatrix, setAttentionMatrix] = useState<number[][]>([])
  const [queryToken, setQueryToken] = useState(0)
  const [head, setHead] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset selected token when input changes
  useEffect(() => {
    setQueryToken(0)
  }, [inputText])

  useEffect(() => {
    fetchAttention()
  }, [inputText, head, layer])

  async function fetchAttention() {
    if (!inputText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("http://localhost:8000/v1/attention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          layer: layer - 1,
          head: head,         // null means all heads averaged
          language: "en"
        })
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()

      // Filter out special tokens e.g. <|endoftext|>, [PAD], [CLS] etc.
      const allTokens: string[] = data.tokens
      const keepIndices = allTokens
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => !t.match(/^<\|.*\|>$|^\[.*\]$/))
        .map(({ i }) => i)

      const filteredTokens = keepIndices.map(i => allTokens[i])

      // Rebuild attention matrix keeping only rows/cols for non-special tokens
      const fullMatrix: number[][] = data.patterns[0].attention_matrix
      const filteredMatrix = keepIndices.map(row =>
        keepIndices.map(col => fullMatrix[row]?.[col] ?? 0)
      )

      setTokens(filteredTokens)
      setAttentionMatrix(filteredMatrix)
      setQueryToken(0)

    } catch (err) {
      console.error("attention fetch failed", err)
      setError("Failed to fetch attention data. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  const activeToken = tokens[queryToken] ?? ""
  const currentHead = head === null ? "avg" : head + 1

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col gap-6">

        <p className="text-zinc-400 text-sm">
          CLICK A TOKEN TO SEE WHICH OTHER TOKENS IT PAYS ATTENTION TO
        </p>

        {/* Head selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHead(h => Math.max(0, h - 1))}
            className="px-3 py-1 rounded bg-[#1c1c1f] hover:bg-[#2a2a2e]"
          >
            ◀
          </button>

          <div className="text-zinc-300 text-sm min-w-[80px] text-center">
            Head {head + 1} / 12
          </div>

          <button
            onClick={() => setHead(h => Math.min(11, h + 1))}
            className="px-3 py-1 rounded bg-[#1c1c1f] hover:bg-[#2a2a2e]"
          >
            ▶
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse">
            Fetching attention patterns...
          </div>
        )}

        {/* Token selector */}
        {!loading && tokens.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {tokens.map((token, i) => (
              <button
                key={i}
                onClick={() => setQueryToken(i)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  queryToken === i
                    ? "bg-purple-600"
                    : "bg-[#1c1c1f] hover:bg-[#2a2a2e]"
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        )}

        <FlowArrow />

        {/* Formula */}
        <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
          <div className="px-3 py-2 bg-red-500/20 text-red-300 rounded font-mono">
            Q_{activeToken}
          </div>
          <div className="text-zinc-500 text-lg">·</div>
          <div className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded font-mono">
            K_tokensᵀ
          </div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded font-mono">
            Scores
          </div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-600/30 text-purple-300 rounded font-mono">
            Softmax
          </div>
        </div>

        {/* Attention bars */}
        {!loading && tokens.length > 0 && (
          <>
            <div className="text-sm text-zinc-400">
              Attention weights for <span className="text-white">"{activeToken}"</span>
              {" "}(Head {head + 1})
            </div>

            <div className="flex flex-col gap-3">
              {tokens.map((token, i) => {
                const value = attentionMatrix[queryToken]?.[i] ?? 0
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-24 text-sm truncate text-zinc-300">{token}</span>
                    <div className="flex-1 h-4 bg-[#1c1c1f] rounded overflow-hidden">
                      <div
                        className="h-4 bg-purple-500 rounded transition-all duration-500"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                    <span className="text-zinc-400 text-sm w-14 text-right">
                      {(value * 100).toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {/* Right panel */}
      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col h-full">
        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">Self-Attention</h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            The Query vector for the selected token is compared with the
            Key vectors of every token using a dot product.
            The resulting scores are normalized with softmax to produce
            attention weights.
          </p>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Attention weights show how important each token is when processing
            the selected token. Higher weights mean the model focuses more on
            that token.
          </p>

          <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
            weights = softmax(QKᵀ / √dₖ)
          </div>

          {/* Live stats */}
          {!loading && tokens.length > 0 && attentionMatrix[queryToken] && (
            <div className="bg-[#1c1c1f] p-3 rounded text-sm flex flex-col gap-1">
              <div className="text-zinc-500 text-xs mb-1">LIVE — layer {layer}, head {head + 1}</div>
              <div className="text-zinc-300">
                Top token:{" "}
                <span className="text-purple-400">
                  "{tokens[attentionMatrix[queryToken].indexOf(Math.max(...attentionMatrix[queryToken]))]}"
                </span>
              </div>
              <div className="text-zinc-300">
                Max weight:{" "}
                <span className="text-purple-400">
                  {(Math.max(...attentionMatrix[queryToken]) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

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