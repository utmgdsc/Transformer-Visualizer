"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

function MatMulIntro({ tokens, valueVec, onDone, computingLabel }: {
  tokens: string[]
  valueVec: number[]
  onDone: () => void
  computingLabel: string
}) {
  const ROWS = Math.min(tokens.length, 6)
  const COLS = Math.min(tokens.length, 6)
  const VEC_DIMS = tokens.length
  const CELL = 38, GAP = 4

  function getWeight(i: number, j: number) {
    if (j > i) return 0
    return Math.abs(Math.sin((i + 1) * (j + 2)))
  }
  function getResult(i: number) {
    let sum = 0
    for (let j = 0; j <= i && j < COLS; j++) sum += getWeight(i, j) * (valueVec[j % VEC_DIMS] ?? 0)
    return sum
  }

  const [activeRow, setActiveRow] = useState(-1)
  const [activeVecCell, setActiveVecCell] = useState(-1)
  const [filledResults, setFilledResults] = useState<number[]>([])
  const [phase, setPhase] = useState<"animating" | "done">("animating")
  const doneRef = useRef(false)

  useEffect(() => {
    if (!valueVec.length || doneRef.current) return
    let row = 0
    const sweepRow = () => {
      if (row >= ROWS) {
        setTimeout(() => { setPhase("done"); setTimeout(() => { doneRef.current = true; onDone() }, 600) }, 500)
        return
      }
      setActiveRow(row); setActiveVecCell(-1)
      let col = 0
      const colTimer = setInterval(() => {
        setActiveVecCell(col); col++
        if (col >= VEC_DIMS) {
          clearInterval(colTimer)
          const r = row; setFilledResults(prev => [...prev, r]); row++
          setTimeout(sweepRow, 180)
        }
      }, 60)
    }
    const startTimer = setTimeout(sweepRow, 300)
    return () => clearTimeout(startTimer)
  }, [valueVec])

  return (
    <div className="flex flex-col items-center gap-8 transition-opacity duration-500" style={{ opacity: phase === "done" ? 0 : 1 }}>
      <div className="text-xs text-zinc-500 tracking-widest uppercase mb-2">{computingLabel}</div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col" style={{ gap: GAP }}>
          <div className="flex" style={{ gap: GAP, paddingLeft: 32 }}>
            {Array.from({ length: COLS }).map((_, j) => (
              <div key={j} style={{ width: CELL, fontSize: 9 }} className="text-center text-zinc-600 truncate">{tokens[j]?.slice(0, 4)}</div>
            ))}
          </div>
          {Array.from({ length: ROWS }).map((_, i) => (
            <div key={i} className="flex items-center" style={{ gap: GAP }}>
              <div style={{ width: 28, fontSize: 9 }} className="text-right text-zinc-600 truncate shrink-0 pr-1">{tokens[i]?.slice(0, 4)}</div>
              {Array.from({ length: COLS }).map((_, j) => {
                const val = getWeight(i, j); const isActive = i === activeRow; const alpha = 0.15 + val * 0.82
                return <div key={j} className="rounded transition-all duration-150" style={{ width: CELL, height: CELL, backgroundColor: j > i ? "rgba(255,255,255,0.03)" : isActive ? `rgba(168,85,247,${alpha})` : `rgba(70,70,90,${alpha * 0.5})`, boxShadow: isActive && j <= i ? "0 0 10px rgba(168,85,247,0.5)" : "none", transform: isActive && j <= i ? "scale(1.07)" : "scale(1)" }} />
              })}
            </div>
          ))}
        </div>
        <div className="text-2xl text-zinc-500 font-light shrink-0">×</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">V</div>
          {Array.from({ length: VEC_DIMS }).map((_, i) => {
            const val = valueVec[i] ?? 0; const isActive = i === activeVecCell; const alpha = 0.15 + Math.min(Math.abs(val), 1) * 0.82
            return <div key={i} className="rounded transition-all duration-100" style={{ width: CELL, height: CELL, backgroundColor: `rgba(34,197,94,${alpha})`, boxShadow: isActive ? "0 0 12px rgba(34,197,94,0.8)" : "none", transform: isActive ? "scale(1.12)" : "scale(1)", outline: isActive ? "2px solid rgba(34,197,94,0.6)" : "none" }} />
          })}
        </div>
        <div className="text-2xl text-zinc-500 font-light shrink-0">=</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Out</div>
          {Array.from({ length: ROWS }).map((_, i) => {
            const filled = filledResults.includes(i); const isJustFilled = filledResults[filledResults.length - 1] === i
            const val = getResult(i); const alpha = 0.2 + Math.min(Math.abs(val), 1) * 0.7
            return <div key={i} className="rounded transition-all duration-300" style={{ width: CELL, height: CELL, backgroundColor: filled ? `rgba(168,85,247,${alpha})` : "rgba(255,255,255,0.04)", boxShadow: isJustFilled ? "0 0 14px rgba(168,85,247,0.7)" : "none", transform: isJustFilled ? "scale(1.1)" : "scale(1)" }} />
          })}
        </div>
      </div>
    </div>
  )
}

function AttentionMatrix({ tokens, selectedToken, visible }: { tokens: string[], selectedToken: number, visible: boolean }) {
  const size = tokens.length
  function getValue(i: number, j: number) { if (j > i) return null; return Math.abs(Math.sin((i + 1) * (j + 2))) }
  const CELL = 32, GAP = 5
  return (
    <div className="flex flex-col transition-all duration-500" style={{ gap: GAP, opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(14px)" }}>
      <div className="flex" style={{ gap: GAP, paddingLeft: 36 }}>
        {tokens.map((t, i) => <div key={i} className="text-center text-zinc-500 truncate" style={{ width: CELL, fontSize: 10 }}>{t.slice(0, 4)}</div>)}
      </div>
      {Array.from({ length: size }).map((_, i) => (
        <div key={i} className="flex items-center" style={{ gap: GAP }}>
          <div className="text-right text-zinc-500 truncate shrink-0" style={{ width: 28, fontSize: 10 }}>{tokens[i]?.slice(0, 4)}</div>
          {Array.from({ length: size }).map((_, j) => {
            const val = getValue(i, j); const isRow = i === selectedToken
            if (val === null) return <div key={j} className="rounded" style={{ width: CELL, height: CELL, backgroundColor: "rgba(255,255,255,0.03)" }} />
            const alpha = 0.18 + val * 0.82
            return <div key={j} className="rounded transition-all duration-300" style={{ width: CELL, height: CELL, backgroundColor: isRow ? `rgba(168,85,247,${alpha})` : `rgba(80,80,100,${alpha * 0.55})`, transform: isRow ? "scale(1.1)" : "scale(1)", boxShadow: isRow ? `0 0 8px rgba(168,85,247,${val * 0.6})` : "none" }} />
          })}
        </div>
      ))}
    </div>
  )
}

function VectorHeatmap({ data, color, lookupDim, setLookupDim, visible }: { data: number[], color: string, lookupDim: number | null, setLookupDim: (n: number) => void, visible: boolean }) {
  return (
    <div className="grid transition-all duration-500" style={{ gridTemplateColumns: "repeat(8, 1fr)", gap: 5, opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(14px)" }}>
      {data.map((v, i) => {
        const selected = i === lookupDim; const alpha = 0.15 + Math.min(Math.abs(v), 1) * 0.85
        return <div key={i} onClick={() => setLookupDim(i)} className="rounded cursor-pointer transition-all duration-150" style={{ width: 16, height: 16, backgroundColor: `${color}${alpha})`, transform: selected ? "scale(1.6)" : "scale(1)", boxShadow: selected ? "0 0 8px rgba(255,255,255,0.5)" : "none", outline: selected ? "1px solid rgba(255,255,255,0.4)" : "none", zIndex: selected ? 10 : 1, position: "relative" }} />
      })}
    </div>
  )
}

export default function AttentionOutScreen({ stepIndex, setStepIndex, inputText, layer, head, nHeads, dModel, modelName}: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; layer: number; head: number, nHeads: number, dModel: number, modelName: string
}) {
  const t = useTranslations("attentionOut")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [valueVec, setValueVec] = useState<number[]>([])
  const [outVec, setOutVec] = useState<number[]>([])
  const [lookupDim, setLookupDim] = useState<number | null>(null)
  const [stage, setStage] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const introShownRef = useRef(false)

  const fetchHeadOut = (selToken: number) => {
    fetch("http://localhost:8000/v1/attention/head-out", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText, layer: layer - 1, head, include_bias: true, include_attention_matrix: false, language }),
    }).then(r => r.json()).then(data => {
      const allTokens: string[] = data.tokens ?? []
      const keepIndices = allTokens.map((tok, i) => ({ tok, i })).filter(({ tok }) => !tok.match(/^<\|.*\|>$|^\[.*\]$/)).map(({ i }) => i)
      if (selToken === -1) { setTokens(keepIndices.map(i => allTokens[i])); setSelectedToken(0) }
      const pattern = data.patterns?.[0]
      if (pattern) {
        const idx = keepIndices[selToken === -1 ? 0 : selToken] ?? 0
        setValueVec((pattern.value_vectors?.[idx] ?? []).slice(0, 64))
        setOutVec((pattern.out_vectors?.[idx] ?? []).slice(0, 64))
      }
    }).catch(console.error)
  }

  useEffect(() => { if (!inputText.trim()) return; setShowIntro(true); introShownRef.current = false; fetchHeadOut(-1) }, [inputText, layer, head, language])
  useEffect(() => { if (!inputText.trim() || tokens.length === 0) return; fetchHeadOut(selectedToken) }, [selectedToken])
  useEffect(() => { if (!tokens.length || showIntro) return; setStage(0); [200,450,700,950].forEach((d, i) => setTimeout(() => setStage(i + 1), d)) }, [tokens, selectedToken, showIntro])

  return (
    <div className="flex w-full gap-8 h-full">
      <div className="flex-1 flex flex-col items-center">
        <div className="text-zinc-400 text-base mb-8 tracking-wide">{t("instruction")}</div>

        {showIntro && tokens.length > 0 && valueVec.length > 0 && (
          <MatMulIntro tokens={tokens} valueVec={valueVec} onDone={() => { introShownRef.current = true; setShowIntro(false) }} computingLabel={t("computing")} />
        )}

        <div className="w-full flex flex-col items-center transition-opacity duration-500" style={{ opacity: showIntro ? 0 : 1, pointerEvents: showIntro ? "none" : "auto" }}>
          <div className="flex gap-4 mb-12 flex-wrap justify-center">
            {tokens.map((tok, i) => (
              <button key={i} onClick={() => setSelectedToken(i)} className={`px-5 py-2.5 rounded-xl border text-sm transition ${i === selectedToken ? "bg-purple-600 border-purple-400 text-white" : "bg-[#111114] border-[#2a2a2e] text-zinc-300 hover:border-zinc-500"}`}>{tok}</button>
            ))}
          </div>

          {tokens.length > 0 && (
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="text-sm text-zinc-500">
                {t("token")} <span className="text-purple-400 font-medium">{tokens[selectedToken]}</span>
                <span className="ml-3 text-zinc-700">{t("fromHead", { head: head + 1 })}</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-zinc-500 tracking-widest uppercase">{t("attentionWeights")}</div>
                  <div className="rounded-2xl p-5 transition-all duration-300" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: stage >= 1 ? 1 : 0 }}>
                    <AttentionMatrix tokens={tokens} selectedToken={selectedToken} visible={stage >= 1} />
                  </div>
                </div>
                <div className="text-2xl text-zinc-600 transition-all duration-300 mt-6 shrink-0" style={{ opacity: stage >= 2 ? 1 : 0, transform: stage >= 2 ? "scale(1)" : "scale(0.7)" }}>×</div>
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-zinc-500 tracking-widest uppercase">{t("valueVec", { floor: Math.floor(dModel / nHeads) })}</div>
                  <div className="rounded-2xl p-5 transition-all duration-300" style={{ background: "rgba(34,197,94,0.04)", border: `1px solid ${stage >= 2 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)"}`, opacity: stage >= 2 ? 1 : 0, transform: stage >= 2 ? "translateY(0)" : "translateY(8px)" }}>
                    <VectorHeatmap data={valueVec.length ? valueVec : Array(64).fill(0)} color="rgba(34,197,94," lookupDim={lookupDim} setLookupDim={setLookupDim} visible={stage >= 2} />
                  </div>
                </div>
              </div>
              <div className="text-xl text-zinc-600 transition-all duration-300" style={{ opacity: stage >= 3 ? 1 : 0, transform: stage >= 3 ? "translateY(0)" : "translateY(-6px)" }}>↓</div>
              <div className="flex flex-col items-center gap-3">
                <div className="text-xs text-zinc-500 tracking-widest uppercase">{t("outputVec", { floor: Math.floor(dModel / nHeads) })}</div>
                <div className="rounded-2xl p-5 transition-all duration-300" style={{ background: "rgba(168,85,247,0.04)", border: `1px solid ${stage >= 3 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)"}`, opacity: stage >= 3 ? 1 : 0, transform: stage >= 3 ? "translateY(0)" : "translateY(8px)" }}>
                  <VectorHeatmap data={outVec.length ? outVec : Array(64).fill(0)} color="rgba(168,85,247," lookupDim={lookupDim} setLookupDim={setLookupDim} visible={stage >= 3} />
                </div>
              </div>
              <div className="flex gap-3 items-center transition-all duration-300" style={{ opacity: stage >= 3 ? 1 : 0 }}>
                <input type="number" placeholder="dim" min={0} max={63} className="bg-[#1c1c1f] border border-[#2a2a2e] text-zinc-300 px-3 py-1.5 rounded-lg w-24 text-sm focus:outline-none focus:border-purple-500/50 transition" onChange={(e) => setLookupDim(Number(e.target.value))} />
                {lookupDim != null && (
                  <div className="text-sm text-zinc-400 flex gap-4">
                    <span>dim {lookupDim} → <span className="ml-2 text-green-400 font-mono">V {valueVec[lookupDim]?.toFixed(3) ?? "—"}</span></span>
                    <span><span className="text-purple-400 font-mono">Out {outVec[lookupDim]?.toFixed(3) ?? "—"}</span></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-[280px] shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>
        <div className="flex flex-col gap-3 text-xs">
          {(["step1","step2","step3"] as const).map((key, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 opacity-80 ${["bg-purple-400","bg-green-400","bg-violet-400"][i]}`} />
              <span className="text-zinc-400 leading-relaxed">{t(key, { floor: Math.floor(dModel / nHeads) })}</span>
            </div>
          ))}
        </div>
        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("multiHead", { nHeads })}</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">{t("multiHeadDesc", { nHeads, head: head + 1, modelName})}</div>
        </div>
        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("concatenation")}</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">{t("concatenationDesc", {nHeads})}</div>
        </div>
        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-1">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("attentionHeads")}</div>
          <div className="font-mono text-2xl text-zinc-300 font-semibold">{nHeads}</div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">{t("attentionHeadsNote")}</div>
        </div>
        <div className="mt-auto flex justify-end">
          <button onClick={() => setStepIndex(stepIndex + 1)} className="px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] text-zinc-400 hover:bg-[#1a1a20] hover:text-zinc-200 transition">{t("next")}</button>
        </div>
      </div>
    </div>
  )
}