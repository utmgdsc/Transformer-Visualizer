"use client"

import { useSearchParams } from "next/navigation"

export default function EmbeddingAddition() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  const firstID = 21

  return (

<div className="px-8">

  <div className="mb-12">
    <p className="text-gray-400 text-sm">Phase 1: Embedding</p>

    <h2 className="text-3xl font-bold">
      Step 1.3 Adding Positional Information To Token Embeddings
    </h2>
  </div>


  <div className="flex justify-center flex-wrap gap-20">

    {tokens.map((_, i) => (

      <div key={i} className="flex items-center gap-6">

        {/* token embedding */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-36 bg-white/70 rounded-md" />
          <p className="text-sm text-gray-400">
            Token ID {firstID + i}
          </p>
        </div>


        <span className="text-3xl font-bold">+</span>


        {/* positional encoding */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-36 bg-white/50 rounded-md" />
          <p className="text-sm text-gray-400">
            Position {i}
          </p>
        </div>


        <span className="text-3xl font-bold">=</span>


        {/* final embedding */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-36 bg-white rounded-md" />
          <p className="text-sm text-gray-400">
            768-dim vector
          </p>
        </div>

      </div>

    ))}

  </div>

</div>

  )
}