"use client"

import { useState, useEffect, useRef } from "react"

function MatMulIntro({ tokens, valueVec, onDone }: {
  tokens: string[]
  valueVec: number[]
  onDone: () => void
}) {
  const ROWS = Math.min(tokens.length, 6)
  const COLS = Math.min(tokens.length, 6)
  const VEC_DIMS = tokens.length
  const CELL = 38
  const GAP = 4

  function getWeight(i: number, j: number) {
    if (j > i) return 0
    return Math.abs(Math.sin((i + 1) * (j + 2)))
  }

  function getResult(i: number) {
    let sum = 0
    for (let j = 0; j <= i && j < COLS; j++) {
      sum += getWeight(i, j) * (valueVec[j % VEC_DIMS] ?? 0)
    }
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
        setTimeout(() => {
          setPhase("done")
          setTimeout(() => { doneRef.current = true; onDone() }, 600)
        }, 500)
        return
      }
      setActiveRow(row)
      setActiveVecCell(-1)
      let col = 0
      const colTimer = setInterval(() => {
        setActiveVecCell(col)
        col++
        if (col >= VEC_DIMS) {
          clearInterval(colTimer)
          const r = row
          setFilledResults(prev => [...prev, r])
          row++
          setTimeout(sweepRow, 180)
        }
      }, 60)
    }
    const startTimer = setTimeout(sweepRow, 300)
    return () => clearTimeout(startTimer)
  }, [valueVec])

  const opacity = phase === "done" ? 0 : 1

  return (
    <div className="flex flex-col items-center gap-8 transition-opacity duration-500" style={{ opacity }}>
      <div className="text-xs text-zinc-500 tracking-widest uppercase mb-2">Computing Attention Output</div>
      <div className="flex items-center gap-6">
        {/* attention weight matrix */}
        <div className="flex flex-col" style={{ gap: GAP }}>
          <div className="flex" style={{ gap: GAP, paddingLeft: 32 }}>
            {Array.from({ length: COLS }).map((_, j) => (
              <div key={j} style={{ width: CELL, fontSize: 9 }} className="text-center text-zinc-600 truncate">
                {tokens[j]?.slice(0, 4)}
              </div>
            ))}
          </div>
          {Array.from({ length: ROWS }).map((_, i) => (
            <div key={i} className="flex items-center" style={{ gap: GAP }}>
              <div style={{ width: 28, fontSize: 9 }} className="text-right text-zinc-600 truncate shrink-0 pr-1">
                {tokens[i]?.slice(0, 4)}
              </div>
              {Array.from({ length: COLS }).map((_, j) => {
                const val = getWeight(i, j)
                const isActive = i === activeRow
                const alpha = 0.15 + val * 0.82
                return (
                  <div key={j} className="rounded transition-all duration-150" style={{
                    width: CELL, height: CELL,
                    backgroundColor: j > i ? "rgba(255,255,255,0.03)" : isActive ? `rgba(168,85,247,${alpha})` : `rgba(70,70,90,${alpha * 0.5})`,
                    boxShadow: isActive && j <= i ? `0 0 10px rgba(168,85,247,0.5)` : "none",
                    transform: isActive && j <= i ? "scale(1.07)" : "scale(1)"
                  }} />
                )
              })}
            </div>
          ))}
        </div>

        <div className="text-2xl text-zinc-500 font-light shrink-0">×</div>

        {/* value vector */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">V</div>
          {Array.from({ length: VEC_DIMS }).map((_, i) => {
            const val = valueVec[i] ?? 0
            const isActive = i === activeVecCell
            const alpha = 0.15 + Math.min(Math.abs(val), 1) * 0.82
            return (
              <div key={i} className="rounded transition-all duration-100" style={{
                width: CELL, height: CELL,
                backgroundColor: `rgba(34,197,94,${alpha})`,
                boxShadow: isActive ? "0 0 12px rgba(34,197,94,0.8)" : "none",
                transform: isActive ? "scale(1.12)" : "scale(1)",
                outline: isActive ? "2px solid rgba(34,197,94,0.6)" : "none"
              }} />
            )
          })}
        </div>

        <div className="text-2xl text-zinc-500 font-light shrink-0">=</div>

        {/* out vector */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Out</div>
          {Array.from({ length: ROWS }).map((_, i) => {
            const filled = filledResults.includes(i)
            const isJustFilled = filledResults[filledResults.length - 1] === i
            const val = getResult(i)
            const alpha = 0.2 + Math.min(Math.abs(val), 1) * 0.7
            return (
              <div key={i} className="rounded transition-all duration-300" style={{
                width: CELL, height: CELL,
                backgroundColor: filled ? `rgba(168,85,247,${alpha})` : "rgba(255,255,255,0.04)",
                boxShadow: isJustFilled ? "0 0 14px rgba(168,85,247,0.7)" : "none",
                transform: isJustFilled ? "scale(1.1)" : "scale(1)"
              }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AttentionMatrix({ tokens, selectedToken, visible }: {
  tokens: string[], selectedToken: number, visible: boolean
}) {
  const size = tokens.length
  function getValue(i: number, j: number) {
    if (j > i) return null
    return Math.abs(Math.sin((i + 1) * (j + 2)))
  }
  const CELL = 32, GAP = 5
  return (
    <div className="flex flex-col transition-all duration-500"
      style={{ gap: GAP, opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(14px)" }}>
      <div className="flex" style={{ gap: GAP, paddingLeft: 36 }}>
        {tokens.map((t, i) => (
          <div key={i} className="text-center text-zinc-500 truncate" style={{ width: CELL, fontSize: 10 }}>
            {t.slice(0, 4)}
          </div>
        ))}
      </div>
      {Array.from({ length: size }).map((_, i) => (
        <div key={i} className="flex items-center" style={{ gap: GAP }}>
          <div className="text-right text-zinc-500 truncate shrink-0" style={{ width: 28, fontSize: 10 }}>
            {tokens[i]?.slice(0, 4)}
          </div>
          {Array.from({ length: size }).map((_, j) => {
            const val = getValue(i, j)
            const isRow = i === selectedToken
            if (val === null) return <div key={j} className="rounded" style={{ width: CELL, height: CELL, backgroundColor: "rgba(255,255,255,0.03)" }} />
            const alpha = 0.18 + val * 0.82
            return (
              <div key={j} className="rounded transition-all duration-300" style={{
                width: CELL, height: CELL,
                backgroundColor: isRow ? `rgba(168,85,247,${alpha})` : `rgba(80,80,100,${alpha * 0.55})`,
                transform: isRow ? "scale(1.1)" : "scale(1)",
                boxShadow: isRow ? `0 0 8px rgba(168,85,247,${val * 0.6})` : "none"
              }} />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function VectorHeatmap({ data, color, lookupDim, setLookupDim, visible }: {
  data: number[], color: string, lookupDim: number | null,
  setLookupDim: (n: number) => void, visible: boolean
}) {
  return (
    <div className="grid transition-all duration-500"
      style={{ gridTemplateColumns: "repeat(8, 1fr)", gap: 5, opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(14px)" }}>
      {data.map((v, i) => {
        const selected = i === lookupDim
        const alpha = 0.15 + Math.min(Math.abs(v), 1) * 0.85
        return (
          <div key={i} onClick={() => setLookupDim(i)}
            className="rounded cursor-pointer transition-all duration-150"
            style={{
              width: 16, height: 16,
              backgroundColor: `${color}${alpha})`,
              transform: selected ? "scale(1.6)" : "scale(1)",
              boxShadow: selected ? "0 0 8px rgba(255,255,255,0.5)" : "none",
              outline: selected ? "1px solid rgba(255,255,255,0.4)" : "none",
              zIndex: selected ? 10 : 1, position: "relative"
            }} />
        )
      })}
    </div>
  )
}

export default function AttentionOutScreen({
  stepIndex, setStepIndex, inputText, layer, head, language, nHeads
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
  layer: number
  head: number
  language: string
  nHeads: number
}) {
  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [valueVec, setValueVec] = useState<number[]>([])
  const [outVec, setOutVec] = useState<number[]>([])
  const [lookupDim, setLookupDim] = useState<number | null>(null)
  const [stage, setStage] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const introShownRef = useRef(false)

  /* fetch from /v1/attention/head-out */
  useEffect(() => {
    if (!inputText.trim()) return
    setShowIntro(true)
    introShownRef.current = false

    fetch("http://localhost:8000/v1/attention/head-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: inputText,
        layer: layer - 1,
        head: head,
        include_bias: true,
        include_attention_matrix: false,
        language: language,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const allTokens: string[] = data.tokens ?? []
        const keepIndices = allTokens
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => !t.match(/^<\|.*\|>$|^\[.*\]$/))
          .map(({ i }) => i)

        const filtered = keepIndices.map(i => allTokens[i])
        setTokens(filtered)
        setSelectedToken(0)

        const pattern = data.patterns?.[0]
        if (pattern) {
          // value_vectors: array of per-token value vecs — pick first visible token
          const firstIdx = keepIndices[0] ?? 0
          const vv = pattern.value_vectors?.[firstIdx] ?? []
          setValueVec(vv.slice(0, 64))

          const ov = pattern.out_vectors?.[firstIdx] ?? []
          setOutVec(ov.slice(0, 64))
        }
      })
      .catch(console.error)
  }, [inputText, layer, head])

  /* update value+out vec when selected token changes */
  useEffect(() => {
    if (!inputText.trim() || tokens.length === 0) return

    fetch("http://localhost:8000/v1/attention/head-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: inputText,
        layer: layer - 1,
        head: head,
        include_bias: true,
        include_attention_matrix: false,
        language: language,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const pattern = data.patterns?.[0]
        if (!pattern) return

        // find the real index of selectedToken in the full token list
        const allTokens: string[] = data.tokens ?? []
        const keepIndices = allTokens
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => !t.match(/^<\|.*\|>$|^\[.*\]$/))
          .map(({ i }) => i)

        const realIdx = keepIndices[selectedToken] ?? 0
        const vv = pattern.value_vectors?.[realIdx] ?? []
        setValueVec(vv.slice(0, 64))
        const ov = pattern.out_vectors?.[realIdx] ?? []
        setOutVec(ov.slice(0, 64))
      })
      .catch(console.error)
  }, [selectedToken])

  /* stage animation after intro */
  useEffect(() => {
    if (!tokens.length || showIntro) return
    setStage(0)
    setTimeout(() => setStage(1), 200)
    setTimeout(() => setStage(2), 450)
    setTimeout(() => setStage(3), 700)
    setTimeout(() => setStage(4), 950)
  }, [tokens, selectedToken, showIntro])

  const handleIntroDone = () => {
    introShownRef.current = true
    setShowIntro(false)
  }

  const lookupV = lookupDim != null ? valueVec[lookupDim] : null
  const lookupOut = lookupDim != null ? outVec[lookupDim] : null

  return (
    <div className="flex w-full gap-8 h-full">

      {/* LEFT */}
      <div className="flex-1 flex flex-col items-center">
        <div className="text-zinc-400 text-base mb-8 tracking-wide">
          APPLY ATTENTION TO PRODUCE OUTPUT
        </div>

        {showIntro && tokens.length > 0 && valueVec.length > 0 && (
          <MatMulIntro tokens={tokens} valueVec={valueVec} onDone={handleIntroDone} />
        )}

        <div
          className="w-full flex flex-col items-center transition-opacity duration-500"
          style={{ opacity: showIntro ? 0 : 1, pointerEvents: showIntro ? "none" : "auto" }}
        >
          <div className="flex gap-4 mb-12 flex-wrap justify-center">
            {tokens.map((t, i) => (
              <button key={i} onClick={() => setSelectedToken(i)}
                className={`px-5 py-2.5 rounded-xl border text-sm transition ${
                  i === selectedToken
                    ? "bg-purple-600 border-purple-400 text-white"
                    : "bg-[#111114] border-[#2a2a2e] text-zinc-300 hover:border-zinc-500"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {tokens.length > 0 && (
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="text-sm text-zinc-500">
                Token: <span className="text-purple-400 font-medium">{tokens[selectedToken]}</span>
                <span className="ml-3 text-zinc-700">From head {head + 1}</span>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-zinc-500 tracking-widest uppercase">Attention Weights</div>
                  <div className="rounded-2xl p-5 transition-all duration-300"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: stage >= 1 ? 1 : 0 }}>
                    <AttentionMatrix tokens={tokens} selectedToken={selectedToken} visible={stage >= 1} />
                  </div>
                </div>

                <div className="text-2xl text-zinc-600 transition-all duration-300 mt-6 shrink-0"
                  style={{ opacity: stage >= 2 ? 1 : 0, transform: stage >= 2 ? "scale(1)" : "scale(0.7)" }}>×</div>

                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-zinc-500 tracking-widest uppercase">Value (V) — 64 dims</div>
                  <div className="rounded-2xl p-5 transition-all duration-300"
                    style={{
                      background: "rgba(34,197,94,0.04)",
                      border: `1px solid ${stage >= 2 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)"}`,
                      opacity: stage >= 2 ? 1 : 0,
                      transform: stage >= 2 ? "translateY(0)" : "translateY(8px)"
                    }}>
                    <VectorHeatmap
                      data={valueVec.length ? valueVec : Array(64).fill(0)}
                      color="rgba(34,197,94,"
                      lookupDim={lookupDim} setLookupDim={setLookupDim} visible={stage >= 2}
                    />
                  </div>
                </div>
              </div>

              <div className="text-xl text-zinc-600 transition-all duration-300"
                style={{ opacity: stage >= 3 ? 1 : 0, transform: stage >= 3 ? "translateY(0)" : "translateY(-6px)" }}>↓</div>

              <div className="flex flex-col items-center gap-3">
                <div className="text-xs text-zinc-500 tracking-widest uppercase">Attention Output Vector — 64 dims</div>
                <div className="rounded-2xl p-5 transition-all duration-300"
                  style={{
                    background: "rgba(168,85,247,0.04)",
                    border: `1px solid ${stage >= 3 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)"}`,
                    opacity: stage >= 3 ? 1 : 0,
                    transform: stage >= 3 ? "translateY(0)" : "translateY(8px)"
                  }}>
                  <VectorHeatmap
                    data={outVec.length ? outVec : Array(64).fill(0)}
                    color="rgba(168,85,247,"
                    lookupDim={lookupDim} setLookupDim={setLookupDim} visible={stage >= 3}
                  />
                </div>
              </div>

              <div className="flex gap-3 items-center transition-all duration-300" style={{ opacity: stage >= 3 ? 1 : 0 }}>
                <input type="number" placeholder="dim" min={0} max={63}
                  className="bg-[#1c1c1f] border border-[#2a2a2e] text-zinc-300 px-3 py-1.5 rounded-lg w-24 text-sm focus:outline-none focus:border-purple-500/50 transition"
                  onChange={(e) => setLookupDim(Number(e.target.value))} />
                {lookupDim != null && (
                  <div className="text-sm text-zinc-400 flex gap-4">
                    <span>dim {lookupDim} →
                      <span className="ml-2 text-green-400 font-mono">V {lookupV?.toFixed(3) ?? "—"}</span>
                    </span>
                    <span>
                      <span className="text-purple-400 font-mono">Out {lookupOut?.toFixed(3) ?? "—"}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-[280px] shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">Output & Concatenation</div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            Attention scores are used to compute a weighted sum of the Value vectors, producing the final output of the self-attention mechanism.
          </div>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {[
            { color: "bg-purple-400", label: "Masked attention scores (lower triangle only) are multiplied with the Value matrix V" },
            { color: "bg-green-400",  label: "Each row of V is scaled by its attention weight and summed — tokens attended to more contribute more" },
            { color: "bg-violet-400", label: "The result is a new 64-dim vector per token, enriched with context from earlier tokens" },
          ].map(({ color, label }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full ${color} shrink-0 mt-0.5 opacity-80`} />
              <span className="text-zinc-400 leading-relaxed">{label}</span>
            </div>
          ))}
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Multi-Head Attention</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">
            GPT-2 runs <span className="text-zinc-300">{nHeads} attention heads</span> in parallel. Currently showing head {head + 1}.
          </div>
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Concatenation</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">
            The {nHeads} head outputs are concatenated then projected back down through a linear layer which merges all perspectives into one unified representation.
          </div>
        </div>

        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-1">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">Attention Heads</div>
          <div className="font-mono text-2xl text-zinc-300 font-semibold">12</div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">
            Each head sees the full sequence but attends to different parts.
          </div>
        </div>

        <div className="mt-auto flex justify-end">
          <button onClick={() => setStepIndex(stepIndex + 1)}
            className="px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] text-zinc-400 hover:bg-[#1a1a20] hover:text-zinc-200 transition">
            Next →
          </button>
        </div>
      </div>

    </div>
  )
}