"use client"
import { useState, useEffect } from "react"
import FlowArrow from "./FlowArrow"

export default function SelfAttentionScreen({
  stepIndex,
  setStepIndex,
  inputText,
  layer,
  head,
  setHead,
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
  layer: number
  head: number
  setHead: (h: number) => void
}) {
  const [tokens, setTokens] = useState<string[]>([])
  const [attentionMatrix, setAttentionMatrix] = useState<number[][]>([])
  const [queryToken, setQueryToken] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ text: inputText, layer: layer - 1, head, language: "en" })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      const allTokens: string[] = data.tokens
      const keepIndices = allTokens
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => !t.match(/^<\|.*\|>$|^\[.*\]$/))
        .map(({ i }) => i)
      const filteredTokens = keepIndices.map(i => allTokens[i])
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

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">
      <div className="flex flex-col gap-6">
        <p className="text-zinc-400 text-sm">
          CLICK A TOKEN TO SEE WHICH OTHER TOKENS IT PAYS ATTENTION TO
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHead(Math.max(0, head - 1))}
            className="px-3 py-1 rounded bg-[#1c1c1f] hover:bg-[#2a2a2e]"
          >◀</button>
          <div className="text-zinc-300 text-sm min-w-[80px] text-center">Head {head + 1} / 12</div>
          <button
            onClick={() => setHead(Math.min(11, head + 1))}
            className="px-3 py-1 rounded bg-[#1c1c1f] hover:bg-[#2a2a2e]"
          >▶</button>
        </div>
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
        )}
        {loading && <div className="text-zinc-500 text-sm animate-pulse">Fetching attention patterns...</div>}
        {!loading && tokens.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {tokens.map((token, i) => (
              <button key={i} onClick={() => setQueryToken(i)}
                className={`px-4 py-2 rounded-lg transition-colors ${queryToken === i ? "bg-purple-600" : "bg-[#1c1c1f] hover:bg-[#2a2a2e]"}`}>
                {token}
              </button>
            ))}
          </div>
        )}
        <FlowArrow />
        <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
          <div className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded font-mono">Q_{activeToken}</div>
          <div className="text-zinc-500 text-lg">·</div>
          <div className="px-3 py-2 bg-red-500/20 text-red-300 rounded font-mono">K_tokensᵀ</div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded font-mono">Scores</div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-600/30 text-purple-300 rounded font-mono">Softmax</div>
        </div>
        {!loading && tokens.length > 0 && (
          <>
            <div className="text-sm text-zinc-400">
              Attention weights for <span className="text-white">"{activeToken}"</span> (Head {head + 1})
            </div>
            <div className="flex flex-col gap-3">
              {tokens.map((token, i) => {
                const value = attentionMatrix[queryToken]?.[i] ?? 0
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-24 text-sm truncate text-zinc-300">{token}</span>
                    <div className="flex-1 h-4 bg-[#1c1c1f] rounded overflow-hidden">
                      <div className="h-4 bg-purple-500 rounded transition-all duration-500" style={{ width: `${value * 100}%` }} />
                    </div>
                    <span className="text-zinc-400 text-sm w-14 text-right">{(value * 100).toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="w-full shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">Masked Self-Attention</div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Each token computes how much it should attend to every other token, but only to tokens that came before it.
          </div>
        </div>
        <div className="flex flex-col gap-3 text-xs">
          {[
            { color: "bg-blue-400",   label: "Dot product of Q and K matrices produces a square score matrix" },
            { color: "bg-amber-400",  label: "Scores are scaled by √dₖ, then upper triangle is masked to −∞" },
            { color: "bg-purple-400", label: "Softmax converts each row into probabilities summing to 1" },
            { color: "bg-zinc-500",   label: "Dropout optionally zeros some weights during training" },
          ].map(({ color, label }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full ${color} shrink-0 mt-0.5 opacity-80`} />
              <span className="text-zinc-400 leading-relaxed">{label}</span>
            </div>
          ))}
        </div>
        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Formula</div>
          <div className="font-mono text-xs text-zinc-400">
            softmax(<span className="text-blue-400">Q</span><span className="text-zinc-600">·</span><span className="text-red-400">K</span><sup className="text-zinc-500 text-[9px]">ᵀ</sup> <span className="text-zinc-600">/</span> <span className="text-amber-400">√dₖ</span> <span className="text-zinc-600">+ mask</span>) · <span className="text-green-400">V</span>
          </div>
        </div>
        {!loading && tokens.length > 0 && attentionMatrix[queryToken] && (
          <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
            <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Live · layer {layer}, head {head + 1}</div>
            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-600">query token</span>
                <span className="text-purple-300">"{activeToken}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">top attended</span>
                <span className="text-purple-300">
                  "{tokens[attentionMatrix[queryToken].indexOf(Math.max(...attentionMatrix[queryToken]))]}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">max weight</span>
                <span className="text-purple-300">{(Math.max(...attentionMatrix[queryToken]) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-1">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Why mask?</div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">
            GPT-2 is a causal language model — the mask sets future positions to −∞ before softmax, collapsing them to 0% attention.
          </div>
        </div>
        <div className="mt-auto flex justify-end">
          <button onClick={() => setStepIndex(stepIndex + 1)}
            className="px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] text-zinc-400 hover:bg-[#1a1a20] hover:text-zinc-200 transition">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}