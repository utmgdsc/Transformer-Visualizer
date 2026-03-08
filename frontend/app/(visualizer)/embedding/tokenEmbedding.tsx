"use client"

import { useSearchParams } from "next/navigation"

export default function TokenEmbed() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  const tokenIDs = tokens.map((_, i) => 21 + i)

  return (

    <div className="">

      <div className="pl-8 mb-16">
        <p className="text-gray-400 text-sm">Phase 1: Embedding</p>
        <h2 className="text-3xl font-bold">Step 1.2 Token Embedding</h2>
      </div>

      <div className="flex justify-center gap-16 flex-wrap">

        {tokens.map((token, i) => (

          <div key={i} className="flex flex-col items-center">

            <div className="bg-gray-200 text-black px-8 py-4 rounded-lg text-2xl font-semibold mb-6">
              {token}
            </div>

            <div className="text-2xl mb-6">
              ↓
            </div>

            <div className="w-10 h-48 bg-gray-300 rounded-full mb-6"></div>

            <p className="text-gray-400">
              ID: {tokenIDs[i]}
            </p>

          </div>

        ))}

      </div>

    </div>
  )
}