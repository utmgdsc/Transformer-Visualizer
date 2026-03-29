"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

function AttentionMatrix({
  tokens,
  selectedToken
}: {
  tokens: string[]
  selectedToken: number
}) {
  const size = tokens.length

  function getValue(i: number, j: number) {
    if (j > i) return null
    return Math.abs(Math.sin((i + 1) * (j + 2)))
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1 mb-1">
        {tokens.map((t, i) => (
          <div key={i} className="w-4 text-[10px] text-center text-zinc-500">
            {t[0]}
          </div>
        ))}
      </div>
      {Array.from({ length: size }).map((_, i) => (
        <div key={i} className="flex gap-1">
          {Array.from({ length: size }).map((_, j) => {
            const val = getValue(i, j)
            const isSelectedRow = i === selectedToken
            return (
              <div
                key={j}
                className={`w-4 h-4 rounded-sm ${
                  val === null ? "bg-[#1a1a1f]" : isSelectedRow ? "bg-purple-500" : "bg-zinc-600"
                }`}
                style={{ opacity: val === null ? 0.2 : 0.3 + (val ?? 0) * 0.7 }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
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

function generateVector(seedStr: string, length = 4) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i)
  return Array.from({ length }, (_, i) => Math.sin(seed * (i + 1)) * 0.6)
}

export default function AttentionOutScreen({
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
  const t = useTranslations("attentionOut")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [valueVec, setValueVec] = useState<number[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [loadingQKV, setLoadingQKV] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inputText.trim()) { setTokens([]); return }

    const run = async () => {
      setLoadingTokens(true)
      setError(null)
      try {
        const res = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language })
        })
        if (!res.ok) throw new Error(`Tokenize failed: ${res.status}`)
        const data = await res.json()
        const filtered = data.token_embeddings.filter(
          (te: any) => !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
        )
        setTokens(filtered.map((te: any) => te.token))
        setSelectedToken(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Tokenization failed")
        setTokens([])
      } finally {
        setLoadingTokens(false)
      }
    }
    run()
  }, [inputText, language])

  useEffect(() => {
    if (tokens.length === 0 || !inputText.trim()) { setValueVec([]); return }

    const run = async () => {
      setLoadingQKV(true)
      try {
        const res = await fetch("http://localhost:8000/v1/qkv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            layer: layer - 1,
            head: null,
            token_positions: [selectedToken],
            language
          })
        })
        if (!res.ok) throw new Error(`QKV failed: ${res.status}`)
        const data = await res.json()
        if (data.qkv_vectors?.[0]?.value) {
          setValueVec(
            data.qkv_vectors[0].value
              .slice(0, 4)
              .map((v: number) => parseFloat(v.toFixed(2)))
          )
        }
      } catch (err) {
        console.error("QKV fetch error:", err)
        setValueVec([])
      } finally {
        setLoadingQKV(false)
      }
    }
    run()
  }, [inputText, tokens, selectedToken, layer, language])

  const outVec = tokens[selectedToken]
    ? generateVector(tokens[selectedToken] + "_OUT")
    : []

  return (
    <div className="flex w-full gap-10">

      <div className="flex-1 flex flex-col items-center">

        <div className="text-zinc-400 text-base mb-8 tracking-wide">
          {t("instruction")}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loadingTokens && (
          <div className="text-zinc-500 text-sm animate-pulse mb-6">
            {t("loadingTokens")}
          </div>
        )}

        {!loadingTokens && tokens.length > 0 && (
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

        {!loadingTokens && tokens.length > 0 && (
          <div className="flex flex-col items-center gap-10">

            <div className="text-base text-zinc-500">
              {t("token")}{" "}
              <span className="text-purple-400 font-medium">{tokens[selectedToken]}</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500">{t("attentionRow")}</div>
              <AttentionMatrix tokens={tokens} selectedToken={selectedToken} />
            </div>

            <div className="text-zinc-500 text-2xl">×</div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500 flex items-center gap-2">
                {t("valueVector")}
                {loadingQKV && (
                  <span className="text-zinc-600 text-xs animate-pulse">{t("loadingQKV")}</span>
                )}
              </div>
              {valueVec.length > 0 ? (
                <VectorSquares data={valueVec} color="bg-green-500/30 text-green-300" />
              ) : (
                !loadingQKV && <div className="text-zinc-600 text-sm">—</div>
              )}
            </div>

            <div className="text-zinc-500 text-xl">↓</div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-sm text-zinc-500 flex items-center gap-2">
                {t("outputVector")}
                <span className="text-zinc-600 text-xs">{t("static")}</span>
              </div>
              <VectorSquares data={outVec} color="bg-purple-400/30 text-purple-300" />
            </div>

          </div>
        )}

      </div>

      {/* Right panel */}
      <div className="w-[320px] bg-[#111114] border border-[#2a2a2e] rounded-2xl p-6 flex flex-col">
        <div>
          <div className="text-lg font-semibold mb-4">{t("title")}</div>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{t("description1")}</p>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{t("description2")}</p>
          <div className="bg-[#1a1a1f] rounded-lg px-4 py-3 text-sm text-zinc-300 mb-3">
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