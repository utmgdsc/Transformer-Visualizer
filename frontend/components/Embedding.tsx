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

  const [viewMode, setViewMode] = useState<"heatmap" | "topk">("heatmap")
  const [finished, setFinished] = useState(false)

  const [visibleCount, setVisibleCount] = useState(0)
  const [lookupDim, setLookupDim] = useState<number | null>(null)

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
      setEmbeddings([])
      setError(null)
      return
    }

    const fetchEmbeddings = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language: "en" })
        })

        const data = await response.json()

        const filtered = data.token_embeddings.filter((te: any) =>
          typeof te.token === "string" &&
          te.token.trim() !== "" &&
          !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )

        setTokens(filtered.map((te: any) => te.token))
        setEmbeddings(filtered.map((te: any) => te.embedding))
        setSelectedToken(0)
      } catch {
        setError("Failed to fetch embeddings")
        setTokens([])
        setEmbeddings([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmbeddings()
  }, [inputText])

  const currentEmbedding = embeddings[selectedToken] || []

  useEffect(() => {
    if (!currentEmbedding.length) return

    setVisibleCount(0)
    setFinished(false)

    let i = 0

    const interval = setInterval(() => {
      i += 32
      setVisibleCount(i)

      if (i >= 768) {
        clearInterval(interval)
        setFinished(true)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [selectedToken, currentEmbedding])

  function renderHeatmap(vec: number[]) {
    const rows = 24
    const cols = 32

    return (
      <div className="grid grid-cols-32 gap-[2px]">
        {vec.slice(0, rows * cols).map((v, i) => {
          const intensity = Math.min(Math.abs(v), 1)
          const isVisible = i < visibleCount
          const isSelected = i === lookupDim

          const color = v >= 0
            ? `rgba(168,85,247,${intensity})`
            : `rgba(251,146,60,${intensity})`

          return (
            <div
              key={i}
              onClick={() => setLookupDim(i)}
              className={`w-2 h-2 rounded-sm transition-all duration-300 cursor-pointer ${finished ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: isVisible ? color : "#1c1c1f",
                transform: isVisible ? "scale(1)" : "scale(0.6)",
                opacity: isVisible ? 1 : 0.2,
                outline: isSelected ? "2px solid white" : "none"
              }}
            />
          )
        })}
      </div>
    )
  }

  function getTopK(vec: number[], k = 10) {
    return vec
      .map((v, i) => ({ v, i }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
      .slice(0, k)
  }

  const lookupValue =
    lookupDim !== null && currentEmbedding[lookupDim] !== undefined
      ? currentEmbedding[lookupDim]
      : null

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT (UNCHANGED) */}
      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          {t("instruction")}
        </div>

        {loading && <div className="text-zinc-500 text-sm">Fetching embeddings...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
            {tokens.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedToken(i)}
                className={`min-w-[110px] px-4 py-2 rounded-lg border transition
                  ${
                    selectedToken === i
                      ? "bg-purple-600 border-purple-600 scale-105"
                      : "border-[#2a2a2e] hover:scale-105"
                  }
                `}
              >
                {tok}
              </button>
            ))}
          </div>
        )}

        {tokens.length > 0 && !loading && (
          <div className="text-sm text-zinc-400 text-center">
            VECTOR FOR "{tokens[selectedToken]?.toUpperCase()}" — 768 DIMS
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0}
            max={767}
            placeholder="dim (0-767)"
            className="bg-[#1c1c1f] px-3 py-1 rounded text-sm w-32"
            onChange={(e) => setLookupDim(Number(e.target.value))}
          />
          {lookupValue !== null && (
            <div className="text-sm text-zinc-300">
              value: <span className={lookupValue >= 0 ? "text-purple-400" : "text-orange-400"}>
                {lookupValue.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("heatmap")}
            className={`px-3 py-1 rounded ${viewMode === "heatmap" ? "bg-purple-600" : "bg-[#1c1c1f]"}`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode("topk")}
            className={`px-3 py-1 rounded ${viewMode === "topk" ? "bg-purple-600" : "bg-[#1c1c1f]"}`}
          >
            Top Dimensions
          </button>
        </div>

        <div className="w-full max-w-3xl bg-[#151517] p-4 rounded-xl border border-[#2a2a2e]">
          {viewMode === "heatmap" && renderHeatmap(currentEmbedding)}
          {viewMode === "topk" && (
            <div className="flex flex-col gap-3">
              {getTopK(currentEmbedding).map(({ v, i }) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-zinc-400">dim {i}</span>
                  <span className={v >= 0 ? "text-purple-400" : "text-orange-400"}>
                    {v.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-6">

        {/* HEADER */}
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">
            Token Embeddings
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Each token is converted into a high-dimensional vector representing meaning and context.
          </div>
        </div>

        {/* CORE IDEA */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-2">
            How It Works
          </div>
          <div className="text-xs text-zinc-500">
            Each token ID is mapped to a learned vector from an embedding table.
          </div>
          <div className="font-mono text-xs text-zinc-400 mt-2">
            E = Lookup(token_id)
          </div>
        </div>

        {/* POSITIONAL ENCODING */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            Positional Encoding
          </div>
          <div className="text-xs text-zinc-500">
            The model adds positional information so it understands token order in the sequence.
          </div>
        </div>

        {/* FINAL EMBEDDING */}
        <div className="border border-[#1e1e24] rounded-xl p-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase mb-1">
            Final Embedding
          </div>
          <div className="text-xs text-zinc-500">
            Token embedding + positional encoding → final vector used by the transformer.
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            Positive
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded" />
            Negative
          </div>
        </div>

        {/* NEXT BUTTON */}
        <div className="mt-auto flex justify-end">
          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className={`px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] transition ${
              finished
                ? "bg-purple-600 text-white animate-pulse"
                : "text-zinc-400 hover:bg-[#1a1a20]"
            }`}
          >
            {t("next")}
          </button>
        </div>

      </div>

    </div>
  )
}