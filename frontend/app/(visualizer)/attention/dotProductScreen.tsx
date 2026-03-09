"use client"

import { useSearchParams } from "next/navigation"

export default function DotProductScreen() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

<div className="px-8 ">

  <div>
    <p className="text-gray-400">Phase 3: Attention Phase</p>

    <h2 className="text-3xl font-bold ">
      Step 3.1 Computing Query-Key Similarity
    </h2>
  </div>


  <div className="flex items-center gap-32 mt-24">

    <div className="flex items-center space-x-10 text-6xl">

      <span>Dot Product</span>

      <span>=</span>

      <div className="flex flex-col items-center">
        <div className="w-6 h-48 bg-gray-300 rounded-full"></div>
        <span className="text-xl mt-3">Q</span>
      </div>

      <span className="text-5xl">•</span>

      <div className="flex flex-col items-center">
        <div className="w-6 h-48 bg-gray-300 rounded-full"></div>
        <span className="text-xl mt-3">K<sup>T</sup></span>
      </div>

      <span className="text-6xl">→</span>

    </div>


    <div className="flex flex-col items-center">

      <div
        className="grid gap-6 text-xl items-center"
        style={{
          gridTemplateColumns: `120px repeat(${tokens.length}, 40px)`
        }}
      >

        <div></div>

        {tokens.map((token, i) => (
          <span key={`col-${i}`} className="text-center">
            {token}
          </span>
        ))}

        {tokens.map((rowToken, i) => (
          <>

            <span key={`row-${i}`} className="text-right pr-4">
              {rowToken}
            </span>

            {tokens.map((_, j) => (

              <div
                key={`${i}-${j}`}
                className={`w-6 h-6 ${
                  Math.random() > 0.7
                    ? "bg-gray-400"
                    : "bg-gray-200"
                }`}
              />

            ))}

          </>
        ))}

      </div>


      <div className="flex items-center space-x-4 mt-10 text-xl ml-30">

        <span>Min</span>

        <div className="w-40 h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-700"></div>

        <span>Max</span>

      </div>

    </div>

  </div>

</div>

  )
}