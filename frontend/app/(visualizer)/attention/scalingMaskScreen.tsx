"use client"

import { useSearchParams } from "next/navigation"

export default function ScalingMask() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)

  return (

<div className="px-8 ">

  <div>
    <p className="text-gray-400">Phase 3: Attention Phase</p>

    <h2 className="text-3xl font-bold">
      Step 3.2 Scaling Mask
    </h2>
  </div>


  <div className="flex justify-center mt-20 text-6xl items-center gap-8">

    <span>Scaling Mask</span>

    <span>=</span>

    <div className="flex flex-col items-center text-4xl">

      <span>
        Q K<sup>T</sup>
      </span>

      <div className="border-t border-gray-300 w-28 my-2"></div>

      <span className="text-3xl">
        √d<sub>k</sub>
      </span>

    </div>

    <span>+</span>

    <span>M</span>

  </div>


  <div className="flex justify-center mt-12 text-7xl">
    ↓
  </div>


  <div className="flex justify-center items-start gap-20 mt-16">

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


    <div className="flex flex-col gap-6 mt-10">

      <div className="flex items-center gap-4">
        <div className="w-8 h-5 bg-gray-200"></div>
        <span>= Masked</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-8 h-5 bg-gray-600"></div>
        <span>= Valid Scale Value</span>
      </div>

    </div>

  </div>


  <div className="flex flex-col items-center mt-24">

    <div className="w-[500px] h-4 bg-gray-300"></div>

    <p className="mt-6 text-gray-300">
      Some Range goes here
    </p>

  </div>


</div>

  )
}