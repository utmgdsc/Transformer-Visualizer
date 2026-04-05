"use client"
import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

function generateVector(seedStr: string, length = 64) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i)
  return Array.from({ length }, (_, i) => Math.sin(seed * (i + 1)) * 0.6)
}
function gelu(x: number) {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)))
}

function HeatStrip({ data, color, highlightIdx, onHover, label, visible = true }: {
  data: number[]; color: [number,number,number]; highlightIdx: number | null; onHover: (i: number | null) => void; label: string; visible?: boolean
}) {
  const [r, g, b] = color
  return (
    <div className="flex flex-col gap-2 transition-all duration-500" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}>
      <div className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">{label}</div>
      <div className="flex gap-[3px] flex-wrap" style={{ maxWidth: 560 }}>
        {data.map((v, i) => {
          const alpha = 0.12 + Math.min(Math.abs(v), 1) * 0.88; const isHot = i === highlightIdx
          return (
            <div key={i} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}
              className="rounded-[3px] cursor-crosshair transition-all duration-100"
              style={{ width: 14, height: 14, backgroundColor: `rgba(${r},${g},${b},${alpha})`, transform: isHot ? "scale(1.7)" : "scale(1)", boxShadow: isHot ? `0 0 8px rgba(${r},${g},${b},0.8)` : "none", outline: isHot ? `1px solid rgba(${r},${g},${b},0.7)` : "none", zIndex: isHot ? 10 : 1, position: "relative" }} />
          )
        })}
      </div>
    </div>
  )
}

function ActivationBars({ seedVec, color, label, visible }: { seedVec: number[]; color: string; label: string; visible: boolean }) {
  const bars = seedVec.slice(0, 48); const max = Math.max(...bars.map(Math.abs), 0.001)
  return (
    <div className="flex flex-col gap-2 transition-all duration-500" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}>
      <div className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">{label}</div>
      <div className="flex items-end gap-[3px]" style={{ height: 36, maxWidth: 560 }}>
        {bars.map((v, i) => {
          const h = Math.max(2, (Math.abs(v) / max) * 36); const neg = v < 0
          return <div key={i} className="rounded-[2px] shrink-0" style={{ width: 10, height: h, background: neg ? `rgba(239,68,68,${0.3 + (Math.abs(v) / max) * 0.5})` : color, opacity: 0.45 + (Math.abs(v) / max) * 0.55 }} />
        })}
      </div>
    </div>
  )
}

function GeluCurve({ highlightX }: { highlightX: number | null }) {
  const W = 200, H = 60, xMin = -3, xMax = 3, yMin = -0.5, yMax = 1.5
  function toSVG(x: number, y: number) { return [((x - xMin) / (xMax - xMin)) * W, H - ((y - yMin) / (yMax - yMin)) * H] }
  const points: string[] = []
  for (let xi = 0; xi <= 100; xi++) { const x = xMin + (xi / 100) * (xMax - xMin); const [px, py] = toSVG(x, gelu(x)); points.push(`${px},${py}`) }
  let dotEl = null
  if (highlightX !== null) { const cx = Math.max(xMin, Math.min(xMax, highlightX * 3)); const [px, py] = toSVG(cx, gelu(cx)); dotEl = <circle cx={px} cy={py} r={4} fill="rgba(52,211,153,1)" /> }
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9px] tracking-widest text-zinc-600 uppercase">GELU activation</div>
      <svg width={W} height={H} style={{ overflow: "hidden" }}>
        <line x1={0} y1={H * (1.5 / 2)} x2={W} y2={H * (1.5 / 2)} stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
        <polyline points={points.join(" ")} fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        {dotEl}
      </svg>
    </div>
  )
}

function MLPFlow({ attnVec, mlpVec, geluVec, finalVec, hoverIdx, setHoverIdx, phase, labels, nHeads, dModel }: {
  attnVec: number[]; mlpVec: number[]; geluVec: number[]; finalVec: number[];
  hoverIdx: number | null; setHoverIdx: (i: number | null) => void; phase: number;
  labels: { step1: string; step2: string; step3: string; step4: string; residual: string };
  nHeads: number;
  dModel: number;
}) {
  const hVal = hoverIdx !== null ? attnVec[hoverIdx] : null
  return (
    <div className="flex flex-col gap-8 items-start w-full">
      <div className="flex items-center gap-5 w-full">
        <div className="w-6 h-6 rounded-full border border-purple-500/40 flex items-center justify-center text-[10px] text-purple-400 shrink-0">1</div>
        <HeatStrip data={attnVec} color={[168,85,247]} highlightIdx={hoverIdx} onHover={setHoverIdx} label={labels.step1} visible={phase >= 1}/>
      </div>
      <div className="flex items-center gap-3 pl-11 transition-all duration-500" style={{ opacity: phase >= 2 ? 1 : 0 }}>
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-px bg-zinc-700"/>
          <div className="text-[10px] text-zinc-600">Linear (W₁) · {Math.floor(dModel / nHeads)} → {dModel - 1}</div>
          <div className="h-5 w-px bg-zinc-700"/>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 rounded px-2 py-1 ml-2">expands here ↑</div>
      </div>
      <div className="flex items-center gap-5 w-full transition-all duration-500" style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(10px)" }}>
        <div className="w-6 h-6 rounded-full border border-blue-500/40 flex items-center justify-center text-[10px] text-blue-400 shrink-0">2</div>
        <ActivationBars seedVec={mlpVec} color="rgba(59,130,246,0.7)" label={labels.step2} visible={phase >= 2}/>
      </div>
      <div className="flex items-start gap-6 pl-11 transition-all duration-500" style={{ opacity: phase >= 3 ? 1 : 0 }}>
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-px bg-zinc-700"/>
          <div className="text-[10px] text-zinc-600">GELU</div>
          <div className="h-5 w-px bg-zinc-700"/>
        </div>
        <GeluCurve highlightX={hVal}/>
      </div>
      <div className="flex items-center gap-5 w-full transition-all duration-500" style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "translateY(0)" : "translateY(10px)" }}>
        <div className="w-6 h-6 rounded-full border border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-400 shrink-0">3</div>
        <ActivationBars seedVec={geluVec} color="rgba(52,211,153,0.7)" label={labels.step3} visible={phase >= 3}/>
      </div>
      <div className="flex items-center gap-3 pl-11 transition-all duration-500" style={{ opacity: phase >= 4 ? 1 : 0 }}>
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-px bg-zinc-700"/>
          <div className="text-[10px] text-zinc-600">+ Residual</div>
          <div className="h-5 w-px bg-zinc-700"/>
        </div>
        <div className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-2 py-1">{labels.residual}</div>
      </div>
      <div className="flex items-center gap-5 w-full transition-all duration-500" style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? "translateY(0)" : "translateY(10px)" }}>
        <div className="w-6 h-6 rounded-full border border-violet-400/60 bg-violet-500/10 flex items-center justify-center text-[10px] text-violet-300 shrink-0">4</div>
        <HeatStrip data={finalVec} color={[192,132,252]} highlightIdx={hoverIdx} onHover={setHoverIdx} label={labels.step4} visible={phase >= 4}/>
      </div>
    </div>
  )
}

export default function MLPScreen({ stepIndex, setStepIndex, inputText, layer = 1, head = 0, nHeads, dModel }: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; layer?: number; head?: number; nHeads: number; dModel: number
}) {
  const t = useTranslations("mlp")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  // ── tokenize via backend instead of whitespace split ──
  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [phase, setPhase] = useState(0)
  const [finished, setFinished] = useState(false)
  const [realFinalVec, setRealFinalVec] = useState<number[] | null>(null)
  const [realAttnVec, setRealAttnVec] = useState<number[] | null>(null)
  const [lookupDim, setLookupDim] = useState<number | null>(null)

  useEffect(() => {
    if (!inputText.trim()) return
    const run = async () => {
      try {
        const res = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language }),
        })
        const data = await res.json()
        const filtered = data.token_embeddings.filter((te: any) => {
          const tok = te.token
        
          const isSpecial = tok.match(/^<\|.*\|>$|^\[.*\]$/)
          const isWhitespace = tok.replace(/Ġ/g, "").trim() === ""
          return !isSpecial && !isWhitespace})
        const toks = filtered.map((te: any) => te.token)
        setTokens(toks.length > 0 ? toks : inputText.split(/\s+/))
        setSelectedToken(0)
      } catch {
        setTokens(inputText.split(/\s+/))
        setSelectedToken(0)
      }
    }
    run()
  }, [inputText, language])

  useEffect(() => {
    if (!tokens.length) return
    setRealAttnVec(null); setRealFinalVec(null)
    fetch("http://localhost:8000/v1/mlp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText, layer: layer - 1, token_positions: [selectedToken], language }),
    }).then(r => r.json()).then(d => {
      const out = d.mlp_outputs?.[0]
      if (out?.mlp_output) setRealFinalVec(out.mlp_output)
      if (out?.attention_residual) setRealAttnVec(out.attention_residual.slice(0, 64))
      setPhase(0)
      setFinished(false)
      const times = [60, 360, 700, 1040]
      times.forEach((delay, i) => {
        setTimeout(() => {
          const nextPhase = i + 1
          setPhase(nextPhase)
          if (nextPhase === 4) setTimeout(() => setFinished(true), 200)
        }, delay)
      })
    }).catch(console.error)
  }, [inputText, selectedToken, layer, language, tokens])

  useEffect(() => {
    const ts = [150, 450, 800, 1150].map((d, i) => setTimeout(() => setPhase(i + 1), d))
    return () => ts.forEach(clearTimeout)
  }, [])

  const attnVec = realAttnVec ?? generateVector((tokens[selectedToken] ?? "") + "_ATTN")
  const mlpVec = generateVector((tokens[selectedToken] ?? "") + "_MLP")
  const geluVec = mlpVec.map(gelu)
  const finalVec = realFinalVec ? realFinalVec.slice(0, 64) : attnVec.map((v, i) => v + geluVec[i])

  const activeDim = hoverIdx ?? lookupDim
  const isHighDim = activeDim !== null && activeDim >= 64
  const inspectorValues = activeDim !== null ? {
    final: realFinalVec ? realFinalVec[activeDim] : (activeDim < 64 ? finalVec[activeDim] : null),
    attn: activeDim < 64 ? attnVec[activeDim] : null,
  } : null

  const flowLabels = {
    step1: t("flowStep1", { floor: Math.floor(dModel / nHeads) }),
    step2: t("flowStep2", { dModel }),
    step3: t("flowStep3", { dModel }),
    step4: t("flowStep4", { floor: Math.floor(dModel / nHeads) }),
    residual: t("flowResidual"),
  }

  return (
    <div className="flex w-full gap-8 h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase mb-6">{t("instruction")}</div>
        <div className="flex gap-3 mb-8 flex-wrap">
          {tokens.map((tok, i) => (
            <button key={i} onClick={() => setSelectedToken(i)}
              className={`px-4 py-2 rounded-xl border text-sm font-mono transition-all duration-200 ${
                i === selectedToken
                  ? "bg-purple-600/90 border-purple-400/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                  : "bg-[#111114] border-[#2a2a2e] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}>{tok}</button>
          ))}
        </div>
        <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <MLPFlow attnVec={attnVec} mlpVec={mlpVec} geluVec={geluVec} finalVec={finalVec} hoverIdx={hoverIdx} setHoverIdx={setHoverIdx} phase={phase} labels={flowLabels} nHeads={nHeads} dModel={dModel}/>
        </div>
      </div>

      <div className="w-[290px] shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>
        <div className="flex flex-col gap-3 text-xs">
          {(["step1","step2","step3","step4"] as const).map((key, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 opacity-80 ${["bg-purple-500","bg-blue-500","bg-emerald-400","bg-violet-400"][i]}`}/>
              <span className="text-zinc-400 leading-relaxed">{t(key, { floor: Math.floor(dModel / nHeads), dModel })}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-3">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("dimInspector")}</div>
          <input type="number" min={0} max={dModel - 1} placeholder={`0 – ${dModel - 1}`} value={lookupDim ?? ""}
            onChange={(e) => { const v = e.target.value === "" ? null : Math.min(dModel - 1, Math.max(0, Number(e.target.value))); setLookupDim(v) }}
            className="bg-[#111114] border border-[#2a2a2e] text-zinc-300 px-3 py-1.5 rounded-lg w-full text-xs font-mono focus:outline-none focus:border-purple-500/50 transition placeholder-zinc-700"/>
          {inspectorValues ? (
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between"><span className="text-zinc-600">{t("dimLabel")}</span><span className="text-zinc-400">{activeDim}</span></div>
              {!isHighDim ? (
                <>
                  <div className="flex justify-between items-center"><span className="text-zinc-600">{t("attnLabel")}</span><span className="text-purple-400 tabular-nums">{inspectorValues.attn?.toFixed(4) ?? "—"}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-600">{t("finalLabel")}</span><span className="text-violet-300 tabular-nums">{inspectorValues.final?.toFixed(4) ?? "—"}</span></div>
                </>
              ) : (
                <>
                  <div className="text-[10px] text-zinc-700 leading-relaxed">{t("highDimNote")}</div>
                  <div className="flex justify-between items-center"><span className="text-zinc-600">{t("finalLabel")}</span><span className="text-violet-300 tabular-nums">{inspectorValues.final?.toFixed(4) ?? "—"}</span></div>
                </>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-700">{t("dimInspectorHint", { dModelMinus: dModel - 1 })}</div>
          )}
        </div>
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