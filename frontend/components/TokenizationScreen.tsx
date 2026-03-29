"use client"
import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import FlowArrow from "./FlowArrow"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

export default function TokenizationScreen({ stepIndex, setStepIndex, inputText, runSignal, vocabSize, modelName }: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; runSignal: number; vocabSize: number, modelName: string
}) {
  const t = useTranslations("tokenization")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [visibleTokens, setVisibleTokens] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [latestIndex, setLatestIndex] = useState(-1)

  useEffect(() => {
    if (inputText.trim().length === 0) { setTokens([]); return }
    const tokenize = async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language })
        })
        const data = await res.json()
      console.log("before filter:", data.token_embeddings.map((te: any) => JSON.stringify(te.token)))
const cleaned = data.token_embeddings
  .map((t: any) => t.token)
  .filter((t: any) => typeof t === "string" && t.trim() !== "" && !t.match(/^<\|.*\|>$|^\[.*\]$/))
        console.log("cleaned:", cleaned)
        setTokens(cleaned)
      } catch { setError(t("error")); setTokens([]) }
      finally { setLoading(false) }
    }
    tokenize()
  }, [runSignal, language])

  useEffect(() => {
    console.log("animation fired with tokens:", tokens)
    if (tokens.length === 0) return
    setVisibleTokens([]); setFinished(false); setLatestIndex(-1)
    let i = 0
const interval = setInterval(() => {
  if (i >= tokens.length) { clearInterval(interval); setFinished(true); return }
  const currentIndex = i  // ← capture before increment
  const currentToken = tokens[currentIndex]  // ← read token immediately
  i++
  setVisibleTokens(prev => [...prev, currentToken])
  setLatestIndex(currentIndex)
}, 400)
    console.log("visibleTokens at render:", visibleTokens)
    return () => clearInterval(interval)
  }, [tokens])

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">
      <div className="flex flex-col items-center gap-8">
        <div className="text-zinc-500 text-sm w-full text-left">{t("inputLabel")}</div>
        <div className="italic text-3xl text-zinc-200 text-center max-w-3xl">"{inputText}"</div>

        <FlowArrow/>

        <div className="text-zinc-400 text-sm text-center">
          TOKENS ({visibleTokens.length})
        </div>

        {loading && <div className="text-zinc-500 text-sm">{t("loading")}</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
          {visibleTokens.map((token, i) => {
            if (!token) return null
            const isNew = i === latestIndex
            return (
              <div key={i} className={`min-w-[110px] px-4 py-2 border rounded-lg text-center transition border-[#2a2a2e] ${isNew ? "animate-tokenPop border-purple-500" : ""}`}>
                {token}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("whatIsToken")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("whatIsTokenDesc")}</div>
          <div className="font-mono text-xs text-zinc-400 mt-2">"empowers" → ["em", "powers"]</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("vocabulary")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("vocabularyDesc", { modelName })}</div>
          <div className="font-mono text-xs text-zinc-400 mt-1">{t("vocabularySize", { vocabSize })}</div>
          <div className="text-xs text-zinc-500 mt-2">{t("vocabularyNote")}</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("whyMatters")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("whyMattersDesc")}</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("nextStep")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("nextStepDesc")}</div>
        </div>

        <div className="mt-auto flex justify-end">
          <button onClick={() => setStepIndex(stepIndex + 1)}
            className={`px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] transition ${finished ? "bg-purple-600 text-white animate-pulse" : "text-zinc-400 hover:bg-[#1a1a20]"}`}>
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  )
}