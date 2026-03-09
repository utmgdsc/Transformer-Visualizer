"use client"

import { useSearchParams } from "next/navigation"

export default function ScalingMask() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

<div className="px-8">

  <div className="mb-12">
    <p className="text-gray-400 text-sm">Phase 3: Attention</p>

    <h2 className="text-3xl font-bold">
      Step 3.2 Scaling Scores and Hiding Future Tokens
    </h2>
  </div>


  <div className="flex items-center justify-center gap-32 mt-10">


    <div className="flex items-center gap-8 text-6xl">

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

      <span className="text-5xl">Mask (M)</span>

      <span className="text-7xl">→</span>

    </div>


    <div className="flex flex-col items-center gap-6">

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


      <p className="text-gray-400 text-sm ml-30">
        Scaled + Masked Score Matrix
      </p>


      <div className="flex gap-8 text-sm text-gray-400 ml-30">

        <div className="flex items-center gap-3">
          <div className="w-6 h-4 bg-gray-200"></div>
          <span>Masked (future token)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-6 h-4 bg-gray-600"></div>
          <span>Valid score</span>
        </div>

      </div>

    </div>

  </div>

</div>

  )
}