"use client"

import { useState, useEffect } from "react"
import FlowArrow from "./FlowArrow"

export default function SelfAttentionScreen({
  stepIndex,
  setStepIndex,
  inputText
}:{
  stepIndex:number
  setStepIndex:(n:number)=>void
  inputText:string
}){

const tokens =
  inputText.trim().length > 0
    ? inputText.split(/\s+/)
    : []

const [queryToken,setQueryToken] = useState(0)

/* reset selected token if input changes */
useEffect(()=>{
  setQueryToken(0)
},[inputText])

/* deterministic attention generator */
function generateAttention(tokens:string[]){

  const matrix:number[][] = []

  tokens.forEach((token,i)=>{

    const row:number[] = []

    tokens.forEach((_,j)=>{

      let seed = token.charCodeAt(0) + j * 13 + i * 7
      const value = Math.abs(Math.sin(seed)) + 0.1

      row.push(value)

    })

    const sum = row.reduce((a,b)=>a+b,0)

    matrix.push(row.map(v=>v/sum))

  })

  return matrix
}

const attentionMatrix =
  tokens.length > 0
    ? generateAttention(tokens)
    : []

const activeToken = tokens[queryToken] ?? ""

return(

<div className="grid grid-cols-[2fr_1fr] gap-10">

<div className="flex flex-col gap-6">

<p className="text-zinc-400 text-sm">
CLICK A QUERY TOKEN TO SEE HOW MUCH IT ATTENDS TO EACH OTHER TOKEN
</p>

<div className="flex flex-wrap gap-3">

{tokens.map((token,i)=>(
<button
key={i}
onClick={()=>setQueryToken(i)}
className={`px-4 py-2 rounded-lg ${
queryToken === i
? "bg-purple-600"
: "bg-[#1c1c1f]"
}`}
>
{token}
</button>
))}

</div>

<FlowArrow/>

<div className="flex items-center justify-center gap-4 text-sm flex-wrap">

<div className="px-3 py-2 bg-red-500/20 text-red-300 rounded font-mono">
Q_{activeToken}
</div>

<div className="text-zinc-500 text-lg">
·
</div>

<div className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded font-mono">
K_tokensᵀ
</div>

<div className="text-zinc-500 text-lg">
→
</div>

<div className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded font-mono">
Scores
</div>

<div className="text-zinc-500 text-lg">
→
</div>

<div className="px-3 py-2 bg-purple-600/30 text-purple-300 rounded font-mono">
Softmax
</div>

</div>

<div className="text-sm text-zinc-400">
Attention weights for "{activeToken}":
</div>

<div className="flex flex-col gap-3">

{tokens.map((token,i)=>{

const value = attentionMatrix[queryToken]?.[i] ?? 0

return(

<div key={i} className="flex items-center gap-4">

<span className="w-20">{token}</span>

<div className="flex-1 h-4 bg-[#1c1c1f] rounded">
<div
className="h-4 bg-purple-500 rounded"
style={{width:`${value*100}%`}}
/>
</div>

<span className="text-zinc-400">
{(value*100).toFixed(1)}%
</span>

</div>

)

})}

</div>

</div>



<div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col h-full">

<div className="flex flex-col gap-4">

<h2 className="text-xl font-semibold">
Self-Attention
</h2>

<p className="text-zinc-400 text-sm leading-relaxed">
The Query vector for the selected token is compared with the
Key vectors of every token using a dot product.
The resulting scores are normalized with softmax to produce
attention weights.
</p>

<div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
weights = softmax(QKᵀ / √dₖ)
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