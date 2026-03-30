"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

export default function ProbabilitiesScreen({ inputText }: { inputText: string }) {
  const t = useTranslations("output")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [predictions, setPredictions] = useState<{ token: string; probability: number }[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [judgeResult, setJudgeResult] = useState<{score: number; conclusion: string; reason: string; passed: boolean} | null>(null)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)
  const [temperature, setTemperature] = useState(1.0)
  const [topK, setTopK] = useState(5)

  useEffect(() => {
    if (!inputText.trim()) return
    setSelectedToken(null)
    fetchPredictions(inputText)
    setJudgeResult(null)
  }, [inputText, language, temperature, topK])

  async function fetchJudge() {
    setJudgeLoading(true)
    setJudgeError(null)
    setJudgeResult(null)
    try {
      const res = await fetch("http://localhost:8000/v1/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: inputText, generated_text: activeToken.trim() })
      })
      if (!res.ok) throw new Error(`Judge failed: ${res.status}`)
      const data = await res.json()
      setJudgeResult(data)
    } catch (err) {
      setJudgeError(err instanceof Error ? err.message : "Judge failed")
    } finally {
      setJudgeLoading(false)
    }
  }

  async function fetchPredictions(text: string) {
    setLoading(true); setError(null)
    try {
      const res = await fetch("http://localhost:8000/v1/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, temperature, top_k: topK, language })
      })
      if (!res.ok) throw new Error(`Predict failed: ${res.status}`)
      const data = await res.json()
      setPredictions(data.next_token_probabilities)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"))
      setPredictions([])
    } finally { setLoading(false) }
  }

  const displaySentence = inputText.trim()
  const activeToken = selectedToken ?? predictions[0]?.token ?? ""
  
  return (
    <div className="flex w-full gap-10">
      <div className="flex-1 flex flex-col items-center">
        <div className="text-zinc-400 text-base mb-8 tracking-wide">{t("instruction")}</div>

        <div className="text-lg text-zinc-300 mb-10 text-center">
          {displaySentence}{" "}
          {activeToken && <span className="text-purple-400 font-medium">{activeToken.trim()}</span>}
        </div>
    
        {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">{error}</div>}
        {loading && <div className="text-zinc-500 text-sm animate-pulse mb-6">{t("loading")}</div>}

        {!loading && predictions.length > 0 && (
          <>
            <div className="w-full max-w-md flex flex-col gap-3 mb-10">
              {predictions.map((item, i) => {
                const isActive = (selectedToken ?? predictions[0].token) === item.token
                return (
                  <button key={i} onClick={() => setSelectedToken(item.token)} className="flex items-center gap-3 w-full text-left group">
                    <div className={`w-28 text-sm transition ${isActive ? "text-purple-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"}`}>{item.token.trim()}</div>
                    <div className="flex-1 h-2 bg-[#1c1c22] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isActive ? "bg-purple-500" : "bg-zinc-600 group-hover:bg-zinc-500"}`} style={{ width: `${item.probability * 100}%` }}/>
                    </div>
                    <div className="text-xs text-zinc-400 w-12 text-right">{(item.probability * 100).toFixed(1)}%</div>
                  </button>
                )
              })}
            </div>

            <div className="w-full max-w-md flex flex-col gap-3">
              <div className="text-sm text-zinc-500 mb-2">{t("continuations")}</div>
              {predictions.map((item, i) => {
                const isActive = (selectedToken ?? predictions[0].token) === item.token
                return (
                  <button key={i} onClick={() => setSelectedToken(item.token)}
                    className={`text-sm px-4 py-2 rounded-lg border text-left transition ${isActive ? "border-purple-500 bg-purple-500/10 text-purple-300" : "border-[#2a2a2e] text-zinc-300 hover:border-zinc-500"}`}>
                    {displaySentence}{" "}<span className="font-medium">{item.token.trim()}</span>
                    <span className="ml-2 text-xs text-zinc-400">({(item.probability * 100).toFixed(1)}%)</span>
                  </button>
                )
              })}
            </div>
                      
            {/* Hallucination Analysis */}
            <div className="w-full max-w-md mt-6 flex flex-col gap-3">
              <div className="text-sm text-zinc-500 mb-2">{t("hallucinationAnalysis")}</div>

              <button
                onClick={fetchJudge}
                disabled={judgeLoading || !activeToken}
                className="px-4 py-2 rounded-lg border border-[#2a2a2e] text-sm text-zinc-300 hover:border-purple-500 hover:text-purple-300 transition disabled:opacity-50"
              >
                {judgeLoading ? t("analyzing") : t("analyzeButton")}
              </button>

              {judgeError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {judgeError}
                </div>
              )}

              {judgeResult && (
                <div className="flex flex-col gap-2 p-4 rounded-lg border border-[#2a2a2e] bg-[#111114]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">{t("risk")}</span>
                    <span className={`text-sm font-medium ${
                      judgeResult.conclusion === "low" ? "text-green-400" :
                      judgeResult.conclusion === "medium" ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                      {judgeResult.conclusion.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {judgeResult.reason}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="w-[320px] bg-[#111114] border border-[#2a2a2e] rounded-2xl p-6 flex flex-col">
        <div>
          <div className="text-lg font-semibold mb-4">{t("predTitle")}</div>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{t("predDesc1")}</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{t("predDesc2")}</p>
          {/* top-k and temperature */}
          <div className="flex flex-col gap-4 border-t border-[#2a2a2e] pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label className="text-sm text-zinc-400">{t("temperature")}</label>
                <span className="text-sm text-zinc-300">{temperature}</span>
              </div>
              <input type="range" min={0.1} max={2.0} step={0.1} value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-purple-500" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label className="text-sm text-zinc-400">{t("topK")}</label>
                <span className="text-sm text-zinc-300">{topK}</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-purple-500" />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}