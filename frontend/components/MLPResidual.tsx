"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

function VectorSquares({ data, color }: { data: number[]; color: string }) {
  return (
    <div className="flex gap-3">
      {data.map((v, i) => (
        <div key={i} className={`${color} rounded-lg text-sm px-4 py-2`}>
          {v.toFixed(2)}
        </div>
      ))}
    </div>
  )
}

function generateVector(seedStr: string, length = 64) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i)
  return Array.from({ length }, (_, i) => Math.sin(seed * (i + 1)) * 0.6)
}

export default function MLPScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {
  const t = useTranslations("mlp")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
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
          body: JSON.stringify({ text: inputText, language }),
        })
        if (!response.ok) {
          throw new Error(`Tokenization failed: ${response.statusText}`)
        }
        const data = await response.json()
        const filteredTokens = data.token_embeddings
          .map((te: any) => te.token)
          .filter((token: string) => !token.match(/^<\|.*\|>$|^\[.*\]$/))
        setTokens(filteredTokens)
        setSelectedToken(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTokens([])
      } finally {
        setLoading(false)
      }
    }
    tokenize()
  }, [inputText, language])

  const attnVec = tokens[selectedToken]
    ? generateVector(tokens[selectedToken] + "_ATTN").slice(0, 4)
    : []
  const mlpVec = tokens[selectedToken]
    ? generateVector(tokens[selectedToken] + "_MLP").slice(0, 4)
    : []
  const finalVec = attnVec.map((v, i) => v + mlpVec[i])

  return (
    <div className="flex w-full gap-10">

      <div className="flex-1 flex flex-col items-center">

        <div className="text-zinc-400 text-base mb-8 tracking-wide">
          {t("instruction")}
        </div>

        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse mb-6">
            {t("loading")}
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && tokens.length > 0 && (
          <div className="flex gap-4 mb-12 flex-wrap justify-center">
            {tokens.map((tok, i) => (
              <button
                key={i}
                onClick={() => setSelectedToken(i)}
                className={`px-5 py-2.5 rounded-xl border text-sm transition ${
                  i === selectedToken
                    ? "bg-purple-600 border-purple-400 text-white"
                    : "bg-[#111114] border-[#2a2a2e] text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {tok}
              </button>
            ))}
          </div>
        )}

        {!loading && tokens.length > 0 && (
          <div className="flex flex-col items-center gap-10">

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500">{t("attentionOutput")}</div>
              <VectorSquares data={attnVec} color="bg-purple-500" />
            </div>

            <div className="text-zinc-500 text-xl">↓</div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500">{t("mlpTransformation")}</div>
              <VectorSquares data={mlpVec} color="bg-blue-500" />
            </div>

            <div className="flex items-center gap-6">
              <div className="text-zinc-500 text-2xl">+</div>
              <div className="text-sm text-zinc-500">{t("residual")}</div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500">{t("finalVector")}</div>
              <VectorSquares data={finalVec} color="bg-purple-400" />
            </div>

          </div>
        )}

      </div>

      <div className="w-[320px] bg-[#111114] border border-[#2a2a2e] rounded-2xl p-6 flex flex-col">
        <div>
          <div className="text-lg font-semibold mb-4">{t("title")}</div>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{t("description1")}</p>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{t("description2")}</p>
          <div className="bg-[#1a1a1f] rounded-lg px-4 py-3 text-sm text-zinc-300">
            {t("dimensions")}
          </div>
        </div>

        <div className="flex justify-end mt-auto pt-6">
          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className="px-5 py-2 rounded-lg text-sm border border-[#2a2a2e] text-zinc-300 hover:bg-[#1c1c22] transition"
          >
            {t("next")}
          </button>
        </div>
      </div>

    </div>
  )
}