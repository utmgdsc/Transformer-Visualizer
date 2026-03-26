"use client"

import { useState, useEffect } from "react"

export default function QKVScreen({
  stepIndex,
  setStepIndex,
  inputText,
  layer,
  setLayer
}:{
  stepIndex:number
  setStepIndex:(n:number)=>void
  inputText:string
  layer:number
  setLayer:(n:number)=>void
}){

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

  // ---------------- FETCH EMBEDDINGS ----------------
  useEffect(() => {
    if (!inputText.trim()) return

    const run = async () => {
      const res = await fetch("http://localhost:8000/v1/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, language: "en" })
      })

      const data = await res.json()
      const filtered = data.token_embeddings.filter((te:any)=>
        !te.token.match(/^<\|.*\|>$|^\[.*\]$/)
      )

      setTokens(filtered.map((t:any)=>t.token))
      setEmbedding(filtered[0]?.embedding || [])
      setSelectedToken(0)
    }

    run()
  },[inputText])

  // ---------------- FETCH QKV ----------------
  useEffect(() => {
    if (!tokens.length) return

    setLoadingQKV(true)

    const run = async () => {
      const res = await fetch("http://localhost:8000/v1/qkv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          layer: layer - 1,
          head: null,
          token_positions: [selectedToken],
          language: "en"
        })
      })

      const data = await res.json()
      const vec = data.qkv_vectors?.[0]

      if (vec) {
        setQ(vec.query.slice(0, 64))
        setK(vec.key.slice(0, 64))
        setV(vec.value.slice(0, 64))
      }

      setLoadingQKV(false)
    }

    run()
  },[selectedToken, layer, inputText, tokens])

  // ---------------- FLOW ANIMATION ----------------
  useEffect(() => {
    if (!embedding.length || !Q.length) return

    setVisibleCount(0)
    setWeightVisible(0)
    setQkvVisible(0)
    setFinished(false)

    let i = 0

    const interval = setInterval(() => {
      i += 32
      setVisibleCount(i)

      if (i >= 768) {
        clearInterval(interval)

        let w = 0
        const wInterval = setInterval(() => {
          w++
          setWeightVisible(w)

          if (w >= 4) {
            clearInterval(wInterval)

            let qv = 0
            const qInterval = setInterval(() => {
              qv += 4
              setQkvVisible(qv)

              if (qv >= 64) {
                clearInterval(qInterval)
                setFinished(true)
              }
            }, 20)
          }
        }, 120)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [embedding, Q])

  // ---------------- EMBEDDING ----------------
  const EmbeddingMap = () => {
    return (
      <div className="grid grid-cols-48 gap-[2px]">
        {embedding.slice(0, 768).map((v,i)=>{
          const intensity = Math.min(Math.abs(v),1)
          const visible = i < visibleCount
          const selected = i===lookupDim

          return (
            <div
              key={i}
              onClick={()=>setLookupDim(i)}
              className="w-[6px] h-[6px] cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: visible
                  ? `rgba(168,85,247,${intensity})`
                  : "#1c1c1f",
                opacity: visible ? 1 : 0.1,
                transform: selected ? "scale(1.8)" : "scale(1)",
                boxShadow: selected ? "0 0 6px white" : "none"
              }}
            />
          )
        })}
      </div>
    )
  }

  // ---------------- QKV HEATMAP (8x8 BLOCK) ----------------
  const Heatmap = ({data,color}:{data:number[],color:string}) => {
    return (
      <div className="grid grid-cols-8 gap-[4px] justify-center">
        {data.map((v,i)=>{
          const intensity = Math.min(Math.abs(v),1)
          const visible = i < qkvVisible
          const selected = i===lookupDim

          return (
            <div
              key={i}
              onClick={()=>setLookupDim(i)}
              className="w-[12px] h-[12px] rounded-sm cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: visible
                  ? `${color}${intensity})`
                  : "#1c1c1f",
                opacity: visible ? 1 : 0.15,
                transform: selected ? "scale(1.6)" : "scale(1)",
                boxShadow: selected ? "0 0 8px white" : "none"
              }}
            />
          )
        })}
      </div>
    )
  }

  // ---------------- WEIGHTS ----------------
  const WeightBlocks = ({color}:{color:string}) => {
    const values = [0.2,0.6,0.4,0.8]

    return (
      <div className="flex gap-2">
        {values.map((v,i)=>(
          <div
            key={i}
            className="w-6 h-6 rounded-md transition-all duration-300"
            style={{
              backgroundColor: `${color}${v})`,
              opacity: i < weightVisible ? 1 : 0,
              transform: i < weightVisible
                ? "translateY(0px)"
                : "translateY(10px)"
            }}
          />
        ))}
      </div>
    )
  }

  // ---------------- LOOKUP ----------------
  const lookupQ = lookupDim!=null ? Q[lookupDim] : null
  const lookupK = lookupDim!=null ? K[lookupDim] : null
  const lookupV = lookupDim!=null ? V[lookupDim] : null
  const lookupE = lookupDim!=null ? embedding[lookupDim] : null

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-10">

      {/* LEFT */}
      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm">
          EMBEDDING → Q · K · V TRANSFORMATION
        </div>

        {/* TOKENS */}
        <div className="flex gap-3">
          {tokens.map((t,i)=>(
            <button
              key={i}
              onClick={()=>setSelectedToken(i)}
              className={`px-3 py-1 rounded transition-all duration-200 ${
                selectedToken===i
                  ? "bg-purple-600 scale-105"
                  : "bg-[#1c1c1f] hover:scale-105"
              }`}
            >{t}</button>
          ))}
        </div>

        {/* EMBEDDING */}
        <div className="w-full max-w-3xl">
          <div className="text-xs text-zinc-400 mb-1">Embedding (X)</div>
          <EmbeddingMap />
        </div>

        {/* WEIGHTS */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-zinc-500 text-sm">Projection Weights</div>

          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-blue-400">W_Q</span>
              <WeightBlocks color="rgba(59,130,246," />
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-red-400">W_K</span>
              <WeightBlocks color="rgba(239,68,68," />
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-green-400">W_V</span>
              <WeightBlocks color="rgba(34,197,94," />
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loadingQKV && (
          <div className="text-zinc-500 text-sm animate-pulse">
            Computing QKV...
          </div>
        )}

        {/* QKV */}
        {!loadingQKV && (
          <div className="flex gap-12 items-start justify-center">

            <div>
              <div className="text-xs text-zinc-400 mb-2 text-center">
                Query (Q) — 64 dims
              </div>
              <Heatmap data={Q} color="rgba(59,130,246," />
            </div>

            <div>
              <div className="text-xs text-zinc-400 mb-2 text-center">
                Key (K) — 64 dims
              </div>
              <Heatmap data={K} color="rgba(239,68,68," />
            </div>

            <div>
              <div className="text-xs text-zinc-400 mb-2 text-center">
                Value (V) — 64 dims
              </div>
              <Heatmap data={V} color="rgba(34,197,94," />
            </div>

          </div>
        )}

        {/* LOOKUP */}
        <div className="flex gap-3 items-center">
          <input
            type="number"
            placeholder="dim"
            className="bg-[#1c1c1f] px-3 py-1 rounded w-24"
            onChange={(e)=>setLookupDim(Number(e.target.value))}
          />

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

      {/* RIGHT */}
      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <h2 className="text-xl font-semibold mb-4">How QKV is Computed</h2>

        <p className="text-sm text-zinc-400">
          Each dimension is a weighted combination of embedding dimensions.
        </p>

        <div className="mt-4 bg-[#1c1c1f] p-3 rounded font-mono text-sm">
          Q_j = Σ X_i · W_Q[i,j] <br/>
          K_j = Σ X_i · W_K[i,j] <br/>
          V_j = Σ X_i · W_V[i,j]
        </div>

        <div className="mt-auto pt-6 flex justify-end">
          <button
            onClick={()=>setStepIndex(stepIndex+1)}
            className={`px-5 py-2 border border-[#2a2a2e] rounded-lg transition
              ${finished
                ? "bg-purple-600 text-white animate-pulse"
                : "hover:bg-[#1c1c1f]"
              }`}
          >
            Next →
          </button>
        </div>

      </div>

    </div>
  )
}