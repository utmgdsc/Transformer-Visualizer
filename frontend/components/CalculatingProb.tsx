"use client"
import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"

const localeToLanguage: Record<string, string> = { en: "en", fr: "fr", zh: "zh" }

function seedNum(str: string) {
  let s = 0
  for (const c of str) s += c.charCodeAt(0)
  return s
}

function FlowCanvas({ token, dModel, vocabSize }: { token: string; dModel: number; vocabSize: number }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const s = seedNum(token)
  const vecDims = Array.from({ length: 24 }, (_, i) => {
    const v = Math.abs(Math.sin(s * (i + 1) * 0.7))
    const colors = ["#a855f7","#7c3aed","#6d28d9","#8b5cf6","#c084fc","#ddd6fe"]
    return { alpha: 0.12 + v * 0.85, color: colors[i % colors.length] }
  })
  const linDims = Array.from({ length: 18 }, (_, i) => ({ alpha: 0.08 + Math.abs(Math.sin(s * (i + 3) * 1.3)) * 0.55, delay: i * 60 }))
  const smDims = Array.from({ length: 10 }, (_, i) => ({ alpha: 0.1 + Math.abs(Math.sin(s * (i + 7) * 0.9)) * 0.7, delay: i * 80 }))

  return (
    <div ref={canvasRef} className="w-full">
      <style>{`
        @keyframes particleFlow { 0%{opacity:0;transform:translateX(0)} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;transform:translateX(var(--travel))} }
        @keyframes blockPulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        @keyframes dimLight { 0%,100%{opacity:var(--base-alpha)} 50%{opacity:calc(var(--base-alpha) + 0.35)} }
        .particle-a{animation:particleFlow 1.1s ease-in-out var(--delay) infinite}
        .particle-b{animation:particleFlow 1.1s ease-in-out var(--delay) infinite}
        .box-pulse{animation:blockPulse 1.8s ease-in-out infinite}
        .dim-light{animation:dimLight 1.8s ease-in-out var(--anim-delay) infinite}
      `}</style>
      <svg viewBox="0 0 520 200" width="100%" style={{ display: "block" }}>
        <defs>
          <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        <rect x="10" y="60" width="110" height="80" rx="10" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.35)" strokeWidth="0.8"/>
        {vecDims.map((d, i) => <circle key={i} cx={10 + 10 + (i % 8) * 12} cy={60 + 16 + Math.floor(i / 8) * 18} r="4.5" fill={d.color} opacity={d.alpha}/>)}
        <text x="65" y="156" textAnchor="middle" fontSize="10" fill="rgba(168,85,247,0.65)" fontFamily="ui-monospace,monospace">{dModel} dims</text>
        <line x1="120" y1="100" x2="178" y2="100" stroke="rgba(168,85,247,0.22)" strokeWidth="1.5" markerEnd="url(#arr2)"/>
        {[0,1,2,3,4].map(i => <circle key={i} cx="120" cy="100" r="3" fill="#a855f7" className="particle-a" style={{"--delay":`${i*220}ms`,"--travel":"58px"} as React.CSSProperties}/>)}
        <rect x="180" y="40" width="110" height="120" rx="10" fill="rgba(99,102,241,0.07)" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8" className="box-pulse"/>
        {linDims.map((d, i) => <circle key={i} cx={180 + 16 + (i % 6) * 15} cy={40 + 20 + Math.floor(i / 6) * 22} r="4" fill="#6366f1" className="dim-light" style={{"--base-alpha":d.alpha,"--anim-delay":`${d.delay}ms`} as React.CSSProperties} opacity={d.alpha}/>)}
        <text x="235" y="176" textAnchor="middle" fontSize="10" fill="rgba(99,102,241,0.7)" fontFamily="ui-monospace,monospace">Linear</text>
        <text x="235" y="188" textAnchor="middle" fontSize="9" fill="rgba(99,102,241,0.4)" fontFamily="ui-monospace,monospace">{dModel} → {vocabSize}</text>
        <line x1="290" y1="100" x2="348" y2="100" stroke="rgba(6,182,212,0.22)" strokeWidth="1.5" markerEnd="url(#arr2)"/>
        {[0,1,2,3,4].map(i => <circle key={i} cx="290" cy="100" r="3" fill="#06b6d4" className="particle-b" style={{"--delay":`${550+i*220}ms`,"--travel":"58px"} as React.CSSProperties}/>)}
        <rect x="350" y="60" width="90" height="80" rx="10" fill="rgba(6,182,212,0.07)" stroke="rgba(6,182,212,0.4)" strokeWidth="0.8" className="box-pulse"/>
        {smDims.map((d, i) => <circle key={i} cx={350 + 12 + (i % 5) * 14} cy={60 + 18 + Math.floor(i / 5) * 20} r="4" fill="#06b6d4" className="dim-light" style={{"--base-alpha":d.alpha,"--anim-delay":`${d.delay}ms`} as React.CSSProperties} opacity={d.alpha}/>)}
        <text x="395" y="156" textAnchor="middle" fontSize="10" fill="rgba(6,182,212,0.7)" fontFamily="ui-monospace,monospace">Softmax</text>
        <line x1="442" y1="100" x2="508" y2="100" stroke="rgba(6,182,212,0.28)" strokeWidth="1.5" markerEnd="url(#arr2)"/>
        <text x="512" y="96" textAnchor="start" fontSize="9" fill="rgba(6,182,212,0.6)" fontFamily="ui-monospace,monospace">prob. dist.</text>
        <text x="512" y="108" textAnchor="start" fontSize="9" fill="rgba(6,182,212,0.4)" fontFamily="ui-monospace,monospace">Σ = 1</text>
      </svg>
    </div>
  )
}

export default function ProbabilityScreen({ stepIndex, setStepIndex, inputText, nHeads, dModel, vocabSize }: {
  stepIndex: number; setStepIndex: (n: number) => void; inputText: string; nHeads: number; dModel: number; vocabSize: number
}) {
  const t = useTranslations("output")
  const locale = useLocale()
  const language = localeToLanguage[locale] ?? "en"

  const tokens = inputText.trim().length > 0 ? inputText.split(/\s+/) : ["The"]
  const [selectedToken, setSelectedToken] = useState(0)

  const steps = [
    { num: "1", color: "rgba(168,85,247,0.4)", textColor: "text-purple-400", labelKey: "step1Label" as const, descKey: "step1Desc" as const },
    { num: "2", color: "rgba(99,102,241,0.4)",  textColor: "text-indigo-400", labelKey: "step2Label" as const, descKey: "step2Desc" as const },
    { num: "3", color: "rgba(6,182,212,0.4)",   textColor: "text-cyan-400",   labelKey: "step3Label" as const, descKey: "step3Desc" as const },
  ]

  const bullets = [
    { color: "bg-purple-500", key: "bullet1" as const },
    { color: "bg-indigo-500", key: "bullet2" as const },
    { color: "bg-orange-400", key: "bullet3" as const },
    { color: "bg-cyan-400",   key: "bullet4" as const },
  ]

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col gap-8">
        <div className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
          {t("instruction")}
        </div>

        <div className="flex gap-3 flex-wrap">
          {tokens.map((tok, i) => (
            <button key={i} onClick={() => setSelectedToken(i)}
              className={`px-4 py-2 rounded-xl border text-sm font-mono transition-all duration-200 ${
                i === selectedToken
                  ? "bg-purple-600/90 border-purple-400/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                  : "bg-[#111114] border-[#2a2a2e] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}>
              {tok}
            </button>
          ))}
        </div>

        <FlowCanvas token={tokens[selectedToken]} dModel={dModel} vocabSize={vocabSize} />

        <div className="flex flex-col gap-5 mt-2">
          {steps.map(({ num, color, textColor, labelKey, descKey }) => (
            <div key={num} className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5"
                style={{ border: `1px solid ${color}`, color: color.replace("0.4", "0.9") }}>
                {num}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`text-[10px] tracking-[0.16em] uppercase ${textColor}`}>{t(labelKey, {dModel, vocabSize})}</div>
                <div className="text-[11px] text-zinc-600 leading-relaxed max-w-md">{t(descKey, {vocabSize})}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full shrink-0 bg-[#0e0e11] border border-[#1e1e24] rounded-2xl p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-zinc-100 mb-1">{t("title")}</div>
          <div className="text-xs text-zinc-500 leading-relaxed">{t("titleDesc")}</div>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {bullets.map(({ color, key }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full ${color} shrink-0 mt-0.5 opacity-80`} />
              <span className="text-zinc-400 leading-relaxed">{t(key, {dModel, vocabSize})}</span>
            </div>
          ))}
        </div>

        <div className="border border-[#1e1e24] rounded-xl p-3 flex flex-col gap-2">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("whySoftmax")}</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed">{t("whySoftmaxDesc")}</div>
        </div>

        <div className="border-t border-[#1e1e24] pt-4 flex flex-col gap-1">
          <div className="text-[10px] tracking-widest text-zinc-600 uppercase">{t("vocabSize")}</div>
          <div className="font-mono text-2xl text-zinc-300 font-semibold">{vocabSize}</div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">{t("vocabNote")}</div>
        </div>

        <div className="mt-auto flex justify-end">
          <button onClick={() => setStepIndex(stepIndex + 1)}
            className="px-4 py-2 rounded-lg text-xs border border-[#2a2a2e] text-zinc-400 hover:bg-[#1a1a20] hover:text-zinc-200 transition">
            {t("next")}
          </button>
        </div>
      </div>

    </div>
  )
}