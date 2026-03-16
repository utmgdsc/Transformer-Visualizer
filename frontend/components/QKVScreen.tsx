"use client"

import { useState } from "react"
import FlowArrow from "./FlowArrow"

export default function QKVScreen({
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

const [selectedToken,setSelectedToken] = useState(0)

/* deterministic vector generator */
function generateVector(token:string, offset:number){

  let seed = 0
  for(let i=0;i<token.length;i++){
    seed += token.charCodeAt(i)
  }

  return Array.from({length:5},(_,i)=>{
    const val = Math.sin(seed*(i+1+offset))*0.9
    return parseFloat(val.toFixed(2))
  })
}

const Q = tokens.length ? generateVector(tokens[selectedToken],1) : []
const K = tokens.length ? generateVector(tokens[selectedToken],2) : []
const V = tokens.length ? generateVector(tokens[selectedToken],3) : []

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

<div className="flex flex-wrap justify-center gap-4 max-w-3xl">

{tokens.map((t,i)=>(
<button
key={i}
onClick={()=>setSelectedToken(i)}
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