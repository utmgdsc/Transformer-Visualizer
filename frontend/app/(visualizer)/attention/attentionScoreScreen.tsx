"use client"

import { useSearchParams } from "next/navigation"

export default function AttentionScore() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

<div className="px-8 ">

  <div>
    <p className="text-gray-400">Phase 3: Attention Phase</p>

    <h2 className="text-3xl font-bold">
      Step 3.3 Attention Score
    </h2>
  </div>


  <div className="flex items-center gap-32 mt-24">

    <div className="flex items-center text-6xl gap-8">

  <span>Softmax</span>

  <span>(</span>

  <div className="flex flex-col items-center text-4xl">

    <span>
      Q K<sup>T</sup>
    </span>

    <div className="border-t border-gray-300 w-28 my-2"></div>

    <span className="text-3xl">
      √d<sub>k</sub>
    </span>

  </div>

  <span className="text-6xl">+</span>

  <span className="text-6xl">M</span>

  <span className="text-7xl">)</span>

  <span className="text-7xl ml-10">→</span>

</div>


    <div className="flex flex-col items-center">

      <h3 className="text-5xl mb-10">Attention Result</h3>


      <div
        className="grid gap-6 text-xl items-center"
        style={{
          gridTemplateColumns: `120px repeat(${tokens.length}, 40px)`
        }}
      >

        <div></div>

        {tokens.map((token,i) => (
          <span key={"col"+i} className="text-center">
            {token}
          </span>
        ))}


        {tokens.map((rowToken,i) => (
          <>

            <span key={"row"+i} className="text-right pr-4">
              {rowToken}
            </span>

            {tokens.map((_,j) => {

              const masked = j > i

              return (
                <div
                  key={`${i}-${j}`}
                  className={`w-6 h-6 ${
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


      <div className="flex items-center gap-6 mt-12 text-3xl">

        <span>0.0</span>

        <div className="w-52 h-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-700"></div>

        <span>1.0</span>

      </div>

    </div>


    <div className="text-gray-300 text-lg mt-32">
      All rows sum to one
    </div>

  </div>

</div>

  )
}