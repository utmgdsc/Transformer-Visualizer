"use client"

import { useSearchParams } from "next/navigation"

export default function TokenEmbed() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)
  const tokenIDs = tokens.map((_, i) => 21 + i)

  return (

    <div>

      <div className="pl-8 mb-16">
        <p className="text-gray-400 text-sm">
          Phase 1: Embedding
        </p>

        <h2 className="text-3xl font-bold">
          Step 1.2 Converting Tokens Into Embedding Vectors
        </h2>
      </div>


      <div className="flex justify-center gap-20 flex-wrap">

        {tokens.map((token, i) => (

          <div key={i} className="flex flex-col items-center">

            <div className="bg-gray-200 text-black px-6 py-3 rounded-md text-xl font-semibold border border-gray-300 mb-6">
              {token}
            </div>


            <div className="flex flex-col items-center mb-6">
              <div className="w-[2px] h-10 bg-gray-400"></div>
              <div className="text-gray-400 text-lg">↓</div>
            </div>


            <div className="w-6 h-48 bg-gray-300 rounded-md border border-gray-400 mb-6"></div>


            <p className="text-gray-400 text-sm">
              ID: {tokenIDs[i]}
            </p>

          </div>

        ))}

      </div>

    </div>
  )
}