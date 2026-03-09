"use client"

import { useSearchParams } from "next/navigation"

export default function AttentionScore() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

<div className="px-8">

  <div className="mb-12">
    <p className="text-gray-400 text-sm">Phase 3: Attention</p>

    <h2 className="text-3xl font-bold">
      Step 3.3 Applying Softmax
    </h2>
  </div>



  <div className="flex items-center justify-center gap-32 mt-10">


    <div className="flex items-center gap-8 text-6xl">

      <span className="text-6xl">Softmax</span>

      <span>(</span>

      <div className="flex flex-col items-center text-5xl leading-none">

        <span>
          QK<sup>T</sup>
        </span>

        <div className="border-t border-gray-300 w-32 my-2"></div>

        <span>
          √d<sub>k</sub>
        </span>

      </div>

      <span>+</span>

      <span className="text-5xl">M</span>

      <span>)</span>

      <span className="text-7xl">→</span>

    </div>



    <div className="flex flex-col items-center gap-6">

      <h3 className="text-4xl text-gray-300 ml-30">
        Attention Result
      </h3>

      <div
        className="grid gap-5 text-sm items-center"
        style={{
          gridTemplateColumns: `120px repeat(${tokens.length}, 40px)`
        }}
      >

        <div></div>

        {tokens.map((token,i) => (
          <span key={"col"+i} className="text-center text-gray-400">
            {token}
          </span>
        ))}

        {tokens.map((rowToken,i) => (
          <>
            <span key={"row"+i} className="text-right pr-4 text-gray-400">
              {rowToken}
            </span>

            {tokens.map((_,j) => {

              const masked = j > i

              return (
                <div
                  key={`${i}-${j}`}
                  className={`w-6 h-6 rounded-sm ${
                    masked
                      ? "bg-gray-200"
                      : "bg-gray-600"
                  }`}
                />
              )
            })}
          </>
        ))}

      </div>


      <div className="flex items-center gap-6 mt-6 text-xl text-gray-400 ml-30">

        <span>0.0</span>

        <div className="w-56 h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-700 rounded"></div>

        <span>1.0</span>

      </div>

    </div>

  </div>

</div>

  )
}