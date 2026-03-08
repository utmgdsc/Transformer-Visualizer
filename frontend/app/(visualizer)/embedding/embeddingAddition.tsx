"use client"

import { useSearchParams } from "next/navigation"

export default function EmbeddingAddition() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  const firstID = 21
  const lastID = 21 + tokens.length - 1

  return (

<div className="px-8 ">

  <div className="mb-16">
    <p className="text-gray-400 text-sm">Phase 1: Embedding</p>
    <h2 className="text-3xl font-bold">
      Step 1.3 Combining Embedding and Positional Encoding
    </h2>
  </div>

  <div className="max-w-6xl mx-auto">

    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-y-20 gap-x-12">

      <h3 className="text-2xl font-semibold text-center">
        Token Embeddings
      </h3>

      <div />

      <h3 className="text-2xl font-semibold text-center">
        Positional Encoding
      </h3>

      <div />

      <h3 className="text-2xl font-semibold text-center">
        Result
      </h3>


      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>id {firstID}</p>
      </div>

      <div className="text-4xl font-bold text-center">+</div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>0</p>
      </div>

      <div className="text-4xl font-bold text-center">=</div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>768 size vector</p>
      </div>

      {tokens.length > 1 && (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-48 bg-white/70 rounded-full" />
            <p>id {firstID + 1}–{lastID}</p>
          </div>

          <div className="text-4xl font-bold text-center">+</div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-48 bg-white/70 rounded-full" />
            <p>1–{tokens.length - 1}</p>
          </div>

          <div className="text-4xl font-bold text-center">=</div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-48 bg-white/70 rounded-full" />
            <p>768 size vector</p>
          </div>
        </>
      )}

    </div>

  </div>

</div>

  )
}