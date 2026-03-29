"use client"
import FlowArrow from "./FlowArrow"
import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

export default function Embedding({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {
  const t = useTranslations("embedding")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [embeddings, setEmbeddings] = useState<number[][]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          body: JSON.stringify({ text: inputText, language }),
        })
        if (!response.ok) {
          throw new Error(`Tokenization failed: ${response.statusText}`)
        }
        const data = await response.json()
        const filtered = data.token_embeddings.filter(
          (te: any) => !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )
        setTokens(filtered.map((te: any) => te.token))
        setEmbeddings(filtered.map((te: any) => te.embedding.slice(0, 10)))
        setSelectedToken(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTokens([])
        setEmbeddings([])
      } finally {
        setLoading(false)
      }
    }

    tokenize()
  }, [inputText, language])

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          {t("instruction")}
        </div>

        {loading && (
          <div className="text-zinc-500 text-sm">{t("loading")}</div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{t("error", { error })}</div>
        )}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
            {tokens.map((tok, i) => (
              <button
                key={i}
                onClick={() => setSelectedToken(i)}
                className={`min-w-[110px] px-4 py-2 rounded-lg border ${
                  selectedToken === i
                    ? "bg-purple-600 border-purple-600"
                    : "border-[#2a2a2e]"
                }`}
              >
                {tok}
              </button>
            ))}
          </div>
        )}

        <FlowArrow />

        {tokens.length > 0 && !loading && (
          <div className="text-sm text-zinc-400 text-center">
            {t("vectorLabel", { token: tokens[selectedToken].toUpperCase() })}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-3xl">
          {embeddings.length > 0 && embeddings[selectedToken] &&
            embeddings[selectedToken].map((v, i) => {
              const width = Math.abs(v) * 100
              const color = v >= 0 ? "bg-purple-500" : "bg-orange-400"
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 text-zinc-400">
                    {t("dim", { i })}
                  </div>
                  <div className="flex-1 h-4 bg-[#1c1c1f] rounded">
                    <div className={`h-4 rounded ${color}`} style={{ width: `${width}%` }} />
                  </div>
                  <div className="w-12 text-right text-zinc-400">
                    {v.toFixed(2)}
                  </div>
                </div>
              )
            })
          }
        </div>

      </div>

      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">{t("title")}</h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            {t("description")}
          </p>

          <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
            E = Lookup(id) <br/>
            X ∈ ℝ^(n×768)
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span>{t("positive")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-400" />
              <span>{t("negative")}</span>
            </div>
          </div>

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