"use client"

import { useSearchParams } from "next/navigation"

export default function Token() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

    <div className="pl-8">

      <p className="text-sm text-gray-400">
        Phase 1: Embedding
      </p>

      <h2 className="text-3xl font-bold">
        Step 1.1 Splitting The Sentence Into Tokens
      </h2>


      <div className="flex flex-col items-center mt-16">

        <div className="text-4xl font-bold mb-14 text-center">
          {sentence}
        </div>


        <div className="flex flex-wrap justify-center gap-6">

          {tokens.map((token, i) => (
            <div
              key={i}
              className="bg-gray-200 text-black px-6 py-4 rounded-md text-xl font-semibold border border-gray-300 hover:bg-gray-300 transition"
            >
              {token}
            </div>
          ))}

        </div>

      </div>

    </div>

  )
}