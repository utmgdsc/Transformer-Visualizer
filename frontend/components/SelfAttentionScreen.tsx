"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import FlowArrow from "./FlowArrow"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

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
  const t = useTranslations("selfAttention")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [attentionMatrix, setAttentionMatrix] = useState<number[][]>([])
  const [queryToken, setQueryToken] = useState(0)
  const [head, setHead] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setQueryToken(0)
  }, [inputText])

  useEffect(() => {
    fetchAttention()
  }, [inputText, head, layer, language])

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
          head: head,
          language
        })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()

      const allTokens: string[] = data.tokens
      const keepIndices = allTokens
        .map((tok, i) => ({ tok, i }))
        .filter(({ tok }) => !tok.match(/^<\|.*\|>$|^\[.*\]$/))
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
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  const activeToken = tokens[queryToken] ?? ""

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col gap-6">

        <p className="text-zinc-400 text-sm">
          {t("instruction")}
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
            {t("head", { head: head + 1 })}
          </div>
          <button
            onClick={() => setHead(h => Math.min(11, h + 1))}
            className="px-3 py-1 rounded bg-[#1c1c1f] hover:bg-[#2a2a2e]"
          >
            ▶
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse">
            {t("loading")}
          </div>
        )}

        {!loading && tokens.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {tokens.map((token, i) => (
              <button
                key={i}
                onClick={() => setQueryToken(i)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  queryToken === i ? "bg-purple-600" : "bg-[#1c1c1f] hover:bg-[#2a2a2e]"
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
          <div className="px-3 py-2 bg-red-500/20 text-red-300 rounded font-mono">Q_{activeToken}</div>
          <div className="text-zinc-500 text-lg">·</div>
          <div className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded font-mono">K_tokensᵀ</div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded font-mono">Scores</div>
          <div className="text-zinc-500 text-lg">→</div>
          <div className="px-3 py-2 bg-purple-600/30 text-purple-300 rounded font-mono">Softmax</div>
        </div>

        {!loading && tokens.length > 0 && (
          <>
            <div className="text-sm text-zinc-400">
              {t("attentionWeights", { token: activeToken, head: head + 1 })}
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

          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{t("description1")}</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{t("description2")}</p>

          <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
            weights = softmax(QKᵀ / √dₖ)
          </div>

          {!loading && tokens.length > 0 && attentionMatrix[queryToken] && (
            <div className="bg-[#1c1c1f] p-3 rounded text-sm flex flex-col gap-1">
              <div className="text-zinc-500 text-xs mb-1">
                {t("liveLabel", { layer, head: head + 1 })}
              </div>
              <div className="text-zinc-300">
                {t("topToken")}{" "}
                <span className="text-purple-400">
                  "{tokens[attentionMatrix[queryToken].indexOf(Math.max(...attentionMatrix[queryToken]))]}"
                </span>
              </div>
              <div className="text-zinc-300">
                {t("maxWeight")}{" "}
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
            {t("next")}
          </button>
        </div>
      </div>

    </div>
  )
}