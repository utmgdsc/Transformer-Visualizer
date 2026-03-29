"use client"

import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import FlowArrow from "./FlowArrow"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

export default function TokenIDScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {
  const t = useTranslations("tokenID")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [tokenIDs, setTokenIDs] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
      setTokenIDs([])
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
        setTokenIDs(filtered.map((te: any) => te.token_id))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTokens([])
        setTokenIDs([])
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
          {t("description")}
        </div>

        {loading && (
          <div className="text-zinc-500 text-sm">{t("loading")}</div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{t("error", { error })}</div>
        )}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
            {tokens.map((token, i) => (
              <div
                key={i}
                className="min-w-[120px] px-5 py-3 border border-[#2a2a2e] rounded-lg flex flex-col items-center"
              >
                <div className="text-zinc-300">{token}</div>
                <div className="text-lg font-semibold">{tokenIDs[i]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">

          <FlowArrow />

          <div className="text-sm text-zinc-400 text-center">
            {t("matrixLabel")}
          </div>

          <div className="bg-[#151517] border border-[#2a2a2e] rounded-lg p-4 flex flex-col gap-2">

            <div className="text-xs text-zinc-500 mb-2">
              {t("matrixSlice")}
            </div>

            {tokenIDs.map((id) => (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded bg-purple-900/20"
              >
                <div className="w-20 text-zinc-400 text-sm">
                  {t("matrixRow", { id })}
                </div>
                <div className="flex gap-1">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="w-5 h-4 bg-purple-500/70 rounded" />
                  ))}
                </div>
                <div className="text-xs text-zinc-500 ml-2">
                  {t("matrixDims")}
                </div>
              </div>
            ))}

          </div>

        </div>

      </div>

      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">{t("title")}</h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            {t("description2")}
          </p>

          {tokens.length > 0 && (
            <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
              {t("example", { token: tokens[0], id: tokenIDs[0] })}
            </div>
          )}

          <div className="border-l-2 border-purple-500 pl-4 text-zinc-400 text-sm">
            {t("embeddingNote")}
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