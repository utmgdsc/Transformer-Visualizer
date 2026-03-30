"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

export default function QKVScreen({ stepIndex, setStepIndex, inputText, layer, setLayer, nHeads, dModel}: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; layer: number; setLayer: (n: number) => void, nHeads: number; dModel: number
}) {
  const t = useTranslations("qkv")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState(0)
  const [embedding, setEmbedding] = useState<number[]>([])
  const [Q, setQ] = useState<number[]>([])
  const [K, setK] = useState<number[]>([])
  const [V, setV] = useState<number[]>([])
  const [lookupDim, setLookupDim] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [weightVisible, setWeightVisible] = useState(0)
  const [qkvVisible, setQkvVisible] = useState(0)
  const [loadingQKV, setLoadingQKV] = useState(true)
  const [finished, setFinished] = useState(false)
  const isLayerSwitch = useRef(false)
  const headDim = Math.floor(dModel / nHeads)

  useEffect(() => {
    if (!inputText.trim()) return
    fetch("http://localhost:8000/v1/tokenize", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText, language })
    }).then(r => r.json()).then(data => {
      const filtered = data.token_embeddings.filter((te: any) => !te.token.match(/^<\|.*\|>$|^\[.*\]$/))
      setTokens(filtered.map((t: any) => t.token))
      setEmbedding(filtered[0]?.embedding || [])
      setSelectedToken(0)
    })
  }, [inputText, language])

  const fetchQKV = (isLayer: boolean) => {
    if (!tokens.length) return
    isLayerSwitch.current = isLayer; setLoadingQKV(true)
    fetch("http://localhost:8000/v1/qkv", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText, layer: layer - 1, head: null, token_positions: [selectedToken], language })
    }).then(r => r.json()).then(data => {
      const vec = data.qkv_vectors?.[0]
      if (vec) {         setQ(vec.query.slice(0, headDim))
        setK(vec.key.slice(0, headDim))
        setV(vec.value.slice(0, headDim)) }
      setLoadingQKV(false)
    })
  }

  useEffect(() => { fetchQKV(false) }, [selectedToken, inputText, tokens])
  useEffect(() => { fetchQKV(true) }, [layer])

  useEffect(() => {
    if (!embedding.length || !Q.length) return
    if (isLayerSwitch.current) {
      setQkvVisible(0); setFinished(false); setVisibleCount(dModel); setWeightVisible(4)
      let qv = 0
      const qi = setInterval(() => { qv += 4; setQkvVisible(qv); if (qv >= 64) { clearInterval(qi); setFinished(true) } }, 20)
      return () => clearInterval(qi)
    }
    setVisibleCount(0); setWeightVisible(0); setQkvVisible(0); setFinished(false)
    let i = 0
    const interval = setInterval(() => {
      i += 32; setVisibleCount(i)
      if (i >= dModel) {
        clearInterval(interval)
        setTimeout(() => {
          let w = 0
          const wi = setInterval(() => {
            w++; setWeightVisible(w)
            if (w >= 4) {
              clearInterval(wi)
              setTimeout(() => {
                let qv = 0
                const qi = setInterval(() => { qv += 4; setQkvVisible(qv); if (qv >= 64) { clearInterval(qi); setFinished(true) } }, 20)
              }, 300)
            }
          }, 120)
        }, 200)
      }
    }, 20)
    return () => clearInterval(interval)
  }, [embedding, Q])

  const EmbeddingMap = () => (
    <div className="grid grid-cols-48 gap-[2px]">
      {embedding.slice(0,dModel).map((v,i) => {
        const visible = i < visibleCount; const selected = i === lookupDim
        return <div key={i} onClick={() => setLookupDim(i)} className="w-[6px] h-[6px] transition-all cursor-pointer"
          style={{ backgroundColor: visible ? `rgba(168,85,247,${Math.abs(v)})` : "#1c1c1f", opacity: visible ? 1 : 0.1, transform: selected ? "scale(1.6)" : "scale(1)", boxShadow: selected ? "0 0 6px white" : "none" }}/>
      })}
    </div>
  )

  const WeightBlocks = ({ color, label }: { color: string; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="flex gap-2">
        {[0.2,0.6,0.4,0.8].map((v,i) => (
          <div key={i} className="w-6 h-6 rounded-md transition-all duration-300"
            style={{ backgroundColor:`${color}${v})`, opacity: i<weightVisible ? 1 : 0, transform: i<weightVisible ? "translateY(0px)" : "translateY(10px)" }}/>
        ))}
      </div>
    </div>
  )

  const Heatmap = ({ data, color, label }: { data: number[]; color: string; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="grid grid-cols-8 gap-[4px]">
        {data.map((v,i) => {
          const visible = i < qkvVisible; const selected = i === lookupDim
          return <div key={i} onClick={() => setLookupDim(i)} className="w-[12px] h-[12px] rounded-sm cursor-pointer transition-all"
            style={{ backgroundColor: visible ? `${color}${Math.abs(v)})` : "#1c1c1f", opacity: visible ? 1 : 0.15, transform: selected ? "scale(1.6)" : "scale(1)", boxShadow: selected ? "0 0 8px white" : "none" }}/>
        })}
      </div>
    </div>
  )

  const lookupQ = lookupDim!=null ? Q[lookupDim] : null
  const lookupK = lookupDim!=null ? K[lookupDim] : null
  const lookupV = lookupDim!=null ? V[lookupDim] : null
  const lookupE = lookupDim!=null ? embedding[lookupDim] : null

  const qkvItems = [
    { color: "bg-blue-400",  label: "Query (Q)", descKey: "queryDesc" as const },
    { color: "bg-red-400",   label: "Key (K)",   descKey: "keyDesc"   as const },
    { color: "bg-green-400", label: "Value (V)", descKey: "valueDesc" as const },
  ]

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">
      <div className="flex flex-col items-center gap-8">
        <div className="text-zinc-400 text-sm">{t("instruction")}</div>
        <div className="flex gap-3">
          {tokens.map((tok,i) => (
            <button key={i} onClick={() => setSelectedToken(i)}
              className={`px-3 py-1 rounded ${selectedToken===i ? "bg-purple-600 scale-105" : "bg-[#1c1c1f] hover:scale-105"}`}>{tok}</button>
          ))}
        </div>
        <EmbeddingMap/>
        <div className={`text-3xl ${weightVisible > 0 ? "opacity-100 text-purple-400" : "opacity-0"}`}>×</div>
        <div className="flex gap-8">
          <WeightBlocks color="rgba(59,130,246," label="W_Q"/>
          <WeightBlocks color="rgba(239,68,68," label="W_K"/>
          <WeightBlocks color="rgba(34,197,94," label="W_V"/>
        </div>
        <div className={`text-3xl ${weightVisible >= 4 ? "opacity-100 text-purple-400" : "opacity-0"}`}>=</div>
        {!loadingQKV && (
          <div className="flex gap-12">
            <Heatmap data={Q} color="rgba(59,130,246," label={`Query (Q) — ${headDim ?? "?"} dims`}/>
            <Heatmap data={K} color="rgba(239,68,68," label={`Key (K) — ${headDim ?? "?"} dims`}/>
            <Heatmap data={V} color="rgba(34,197,94," label={`Value (V) — ${headDim ?? "?"} dims`}/>
          </div>
        )}
        <div className="flex gap-3 items-center">
          <input type="number" placeholder="dim" className="bg-[#1c1c1f] px-3 py-1 rounded w-24" onChange={(e) => setLookupDim(Number(e.target.value))}/>
          {lookupDim!=null && (
            <div className="text-sm">
              dim {lookupDim} →
              <span className="ml-2 text-purple-400">X {lookupE?.toFixed(3)}</span>
              <span className="ml-2 text-blue-400">Q {lookupQ?.toFixed(3)}</span>
              <span className="ml-2 text-red-400">K {lookupK?.toFixed(3)}</span>
              <span className="ml-2 text-green-400">V {lookupV?.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>
        <div className="flex flex-col gap-3 text-xs">
          {qkvItems.map(({ color, label, descKey }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full ${color} shrink-0 mt-0.5 opacity-80`}/>
              <span className="text-zinc-400 leading-relaxed"><span className="text-zinc-300">{label} — </span>{t(descKey)}</span>
            </div>
          ))}
        </div>
        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("formula")}</div>
          <div className="font-mono text-[11px] text-zinc-500 leading-relaxed flex flex-col gap-0.5">
            <div><span className="text-blue-400">Q</span><sub className="text-[9px]">j</sub> <span className="text-zinc-700">= Σ</span> X<sub className="text-[9px]">i</sub> <span className="text-zinc-700">·</span> <span className="text-blue-400">W_Q</span><sub className="text-[9px]">[i,j]</sub> <span className="text-zinc-700">+ b</span></div>
            <div><span className="text-red-400">K</span><sub className="text-[9px]">j</sub> <span className="text-zinc-700">= Σ</span> X<sub className="text-[9px]">i</sub> <span className="text-zinc-700">·</span> <span className="text-red-400">W_K</span><sub className="text-[9px]">[i,j]</sub> <span className="text-zinc-700">+ b</span></div>
            <div><span className="text-green-400">V</span><sub className="text-[9px]">j</sub> <span className="text-zinc-700">= Σ</span> X<sub className="text-[9px]">i</sub> <span className="text-zinc-700">·</span> <span className="text-green-400">W_V</span><sub className="text-[9px]">[i,j]</sub> <span className="text-zinc-700">+ b</span></div>
          </div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">{t("formulaNote")}</div>
        </div>
        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("multiHead", { nHeads })}</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">{t("multiHeadDesc", { nHeads })}</div>
        </div>
        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-1">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("attentionHeads")}</div>
          <div className="font-mono text-2xl text-zinc-300 font-semibold">{ nHeads }</div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">{t("attentionHeadsNote", { floor: Math.floor(dModel / nHeads), dModel })}</div>
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