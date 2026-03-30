"use client"

import { useEffect, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import FlowArrow from "./FlowArrow"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

export default function TokenIDScreen({ stepIndex, setStepIndex, inputText, dModel, vocabSize, modelName }: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; dModel: number; vocabSize: number; modelName: string
}) {
  const t = useTranslations("tokenID")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [tokenIDs, setTokenIDs] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (inputText.trim().length === 0) { setTokens([]); setTokenIDs([]); return }
    const tokenize = async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language })
        })
        const data = await res.json()
        const filtered = data.token_embeddings.filter((te: any) =>
          typeof te.token === "string" && te.token.trim() !== "" && !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )
        setTokens(filtered.map((te: any) => te.token))
        setTokenIDs(filtered.map((te: any) => te.token_id))
      } catch { setError(t("error")); setTokens([]); setTokenIDs([]) }
      finally { setLoading(false) }
    }
    tokenize()
  }, [inputText, language])

  useEffect(() => {
    if (tokenIDs.length === 0) return
    setCurrentStep(-1); setFinished(false)
    let i = 0
    const interval = setInterval(() => {
      if (i >= tokenIDs.length) { clearInterval(interval); setTimeout(() => setFinished(true), 250); return }
      setCurrentStep(i); i++
    }, 700)
    return () => clearInterval(interval)
  }, [tokenIDs])

  const filledRows = currentStep >= 0 ? Array.from({ length: currentStep + 1 }, (_, i) => i) : []
  const activeIndex = currentStep

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">
      <div className="flex flex-col items-center gap-8">
        <div className="text-zinc-400 text-sm text-center">{t("description")}</div>

        {loading && <div className="text-zinc-500 text-sm">{t("loading")}</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
            {tokens.map((token, i) => (
              <div key={i} className={`min-w-[120px] px-5 py-3 border rounded-lg flex flex-col items-center transition ${i === activeIndex ? "border-purple-500 bg-purple-900/40 scale-105" : "border-[#2a2a2e]"}`}>
                <div className="text-zinc-300">{token}</div>
                <div className="text-lg font-semibold">{tokenIDs[i] ?? "-"}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <FlowArrow/>
          <div className="text-sm text-zinc-400 text-center">{t("matrixLabel")}</div>
          <div className="bg-[#151517] border border-[#2a2a2e] rounded-lg p-4 flex flex-col gap-2">
            <div className="text-xs text-zinc-500 mb-2">{t("matrixSlice", {vocabSize, dModel})}</div>
            {filledRows.map((i) => {
              const id = tokenIDs[i]
              if (id === undefined) return null
              return (
                <div key={`${id}-${i}`} className="flex items-center gap-3 p-2 rounded bg-purple-700/40 scale-105 transition">
                  <div className="w-20 text-zinc-400 text-sm">{t("matrixRow", { id })}</div>
                  <div className="flex gap-1">{[...Array(8)].map((_, j) => <div key={j} className="w-5 h-4 rounded bg-purple-400"/>)}</div>
                  <div className="text-xs text-zinc-500 ml-2">{t("matrixDims", { dModel })}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>

        {activeIndex >= 0 && (
          <div className="border border-[#1e1e24] rounded-xl p-3">
            <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("example")}</div>
            <div className="font-mono text-xs text-zinc-400">"{tokens[activeIndex]}" → {tokenIDs[activeIndex]}</div>
          </div>
        )}

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("matrixInfo")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("matrixInfoDesc", { modelName })}</div>
          <div className="font-mono text-xs text-zinc-400 mt-1">{t("matrixSize", { vocabSize, dModel })}</div>
          <div className="text-xs text-zinc-500 mt-2">{t("matrixParams", {params: Math.round(vocabSize * dModel / 1e6)})}</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("semantics")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("semanticsDesc")}</div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">{t("keyInsight")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("keyInsightDesc")}</div>
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