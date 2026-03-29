"use client"
import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import FlowArrow from "./FlowArrow"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

export default function TokenizationScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {
  const t = useTranslations("tokenization")
  const locale = useLocale()                       
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTokens([])
      } finally {
        setLoading(false)
      }
    }
    tokenize()
  }, [inputText, language]) // ✅ add language to deps so it re-fetches on locale change

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">
      <div className="flex flex-col items-center gap-8">
        <div className="text-zinc-500 text-sm w-full text-left">
          {t("inputLabel")}
        </div>
        <div className="italic text-3xl text-zinc-200 text-center max-w-3xl">
          "{inputText}"
        </div>
        <FlowArrow />
        <div className="text-zinc-400 text-sm text-center">
          {t("tokensLabel", { count: tokens.length })}
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
                className="min-w-[110px] px-4 py-2 border border-[#2a2a2e] rounded-lg text-center"
              >
                {token}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">{t("description")}</p>
        <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
          Input → [t1, t2, … t{tokens.length}]
        </div>
        <div className="flex justify-end pt-6">
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