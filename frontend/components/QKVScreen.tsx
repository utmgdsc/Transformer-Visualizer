"use client"

import { useState, useEffect } from "react"
import FlowArrow from "./FlowArrow"

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
  const [Q, setQ] = useState<number[]>([])
  const [K, setK] = useState<number[]>([])
  const [V, setV] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tokenize the input text
  useEffect(() => {
    if (inputText.trim().length === 0) {
      setTokens([])
      setError(null)
      return
    }

    const tokenize = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("http://localhost:8000/v1/tokenize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
            language: "en",
          }),
        })

        if (!response.ok) {
          throw new Error(`Tokenization failed: ${response.statusText}`)
        }

        const data = await response.json()
        // Filter out special tokens
        const filtered = data.token_embeddings.filter((te: any) => !te.token.match(/^<\|.*\|>$|^\[.*\]$/))
        setTokens(filtered.map((te: any) => te.token))
        setSelectedToken(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTokens([])
      } finally {
        setLoading(false)
      }
    }

    tokenize()
  }, [inputText])

  // Fetch QKV vectors for selected token and layer
  useEffect(() => {
    if (tokens.length === 0 || !inputText.trim()) {
      setQ([])
      setK([])
      setV([])
      return
    }

    const fetchQKV = async () => {
      try {
        const response = await fetch("http://localhost:8000/v1/qkv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
            layer: layer - 1,  // Convert from 1-12 to 0-11
            head: null,
            token_positions: [selectedToken],
            language: "en",
          }),
        })

        if (!response.ok) {
          throw new Error(`QKV extraction failed: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.qkv_vectors && data.qkv_vectors.length > 0) {
          const vectors = data.qkv_vectors[0]
          // Get first 5 values and round to 2 decimals
          setQ(vectors.query.slice(0, 4).map((v: number) => parseFloat(v.toFixed(2))))
          setK(vectors.key.slice(0, 4).map((v: number) => parseFloat(v.toFixed(2))))
          setV(vectors.value.slice(0, 4).map((v: number) => parseFloat(v.toFixed(2))))
        }
      } catch (err) {
        console.error("QKV fetch error:", err)
        setQ([])
        setK([])
        setV([])
      }
    }

    fetchQKV()
  }, [inputText, selectedToken, layer])

const SmallVector = ({data,color}:{data:number[],color:string}) => (
<div className="flex gap-2 mt-2">
{data.map((v,i)=>(
<div
key={i}
className={`w-11 h-8 rounded text-sm flex items-center justify-center ${color}`}
>
{v}
</div>
))}
</div>
)

return (

<div className="grid grid-cols-[2fr_1fr] gap-10">

<div className="flex flex-col items-center gap-5">

<div className="text-zinc-400 text-sm text-center">
CLICK A TOKEN TO SEE HOW ITS EMBEDDING PRODUCES Q, K, V
</div>

{loading && (
  <div className="text-zinc-500 text-sm">
    Loading...
  </div>
)}

{error && (
  <div className="text-red-500 text-sm">
    Error: {error}
  </div>
)}

{!loading && !error && tokens.length > 0 && (
  <>
    <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

      {tokens.map((t, i) => (
        <button
          key={i}
          onClick={() => setSelectedToken(i)}
          className={`min-w-[110px] px-4 py-2 rounded-lg border ${
            selectedToken === i
              ? "bg-purple-600 border-purple-600"
              : "border-[#2a2a2e]"
          }`}
        >
          {t}
        </button>
      ))}

    </div>
  </>
)}

<FlowArrow />

<div className="px-5 py-2 bg-purple-600/20 border border-purple-600 rounded text-purple-300 text-sm font-mono">
Embedding X (768)
</div>

<FlowArrow />

<div className="grid grid-cols-3 gap-6 items-start mt-2">

<div className="flex flex-col items-center gap-2">

<div className="text-sm text-zinc-400 font-mono">
W_Q
</div>

<div className="px-4 py-2 bg-[#1c1c1f] rounded text-sm font-mono">
768 × d
</div>

<div className="text-red-400 text-sm font-semibold mt-1">
Q
</div>

<SmallVector data={Q} color="bg-red-500/30 text-red-300"/>

</div>

<div className="flex flex-col items-center gap-2">

<div className="text-sm text-zinc-400 font-mono">
W_K
</div>

<div className="px-4 py-2 bg-[#1c1c1f] rounded text-sm font-mono">
768 × d
</div>

<div className="text-blue-400 text-sm font-semibold mt-1">
K
</div>

<SmallVector data={K} color="bg-blue-500/30 text-blue-300"/>

</div>

<div className="flex flex-col items-center gap-2">

<div className="text-sm text-zinc-400 font-mono">
W_V
</div>

<div className="px-4 py-2 bg-[#1c1c1f] rounded text-sm font-mono">
768 × d
</div>

<div className="text-green-400 text-sm font-semibold mt-1">
V
</div>

<SmallVector data={V} color="bg-green-500/30 text-green-300"/>

</div>

</div>

</div>


<div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col h-full">

<div className="flex flex-col gap-4">

<h2 className="text-xl font-semibold">
Embedding → QKV Projection
</h2>

<p className="text-zinc-400 text-sm leading-relaxed">
The attention layer converts each embedding vector into three different
representations.
</p>

<div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
Q = XW_Q  
<br/>
K = XW_K  
<br/>
V = XW_V
</div>

<div className="border-l-2 border-purple-500 pl-4 text-zinc-400 text-sm">
The same embedding vector is projected into three different spaces using
separate learned weight matrices.
</div>

</div>

<div className="flex justify-end mt-auto pt-6">

<button
onClick={()=>setStepIndex(stepIndex+1)}
className="border border-[#2a2a2e] px-5 py-2 rounded-lg hover:bg-[#1c1c1f]"
>
Next →
</button>

</div>

</div>

</div>

)
}