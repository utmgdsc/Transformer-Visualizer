"use client"

import { useSearchParams } from "next/navigation"

export default function Token() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.split(" ")

  return (

    <div className="pl-8 ">

      <p className="text-sm text-gray-400 font-semibold">
        Phase 1: Embedding
      </p>

      <h2 className="text-2xl font-bold mb-20">
        Step 1.1 Tokenization
      </h2>

      <div className="flex flex-col items-center mt-24">

        <div className="text-5xl font-bold mb-20 text-center">
          {sentence}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {tokens.map((token, i) => (
            <div
              key={i}
              className="bg-gray-200 text-black px-8 py-6 rounded-lg text-2xl font-semibold"
            >
              {token}
            </div>
          ))}
        </div>

      </div>

    </div>

  )
}