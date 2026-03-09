"use client"

import { useSearchParams } from "next/navigation"

export default function QKVCalculation() {

  const params = useSearchParams()
  const sentence = params.get("text") || ""

  const tokens = sentence.trim().split(/\s+/)
  const count = tokens.length

  return (

<div className="px-8 ">

  <div>
    <p className="text-gray-400">Phase 2: QKV</p>

    <h2 className="text-3xl font-bold ">
      Step 2.1 Calculating QKV Vectors
    </h2>
  </div>


  <div className="flex flex-col items-center mt-24 space-y-16">

    <div className="flex items-center space-x-6 text-3xl font-semibold">

      <span className="text-5xl">Σ</span>

      <span>
        Embedding<sub>id</sub>
      </span>

      <span>•</span>

      <span>
        Weights<sub>dj</sub>
      </span>

      <span>+</span>

      <span>
        Bias<sub>j</sub>
      </span>

    </div>

    <div className="text-5xl">↓</div>


    <div className="grid grid-cols-7 items-center w-full max-w-5xl">

      <div className="flex justify-center items-end space-x-4">

        <div className="w-6 h-28 bg-gray-300 rounded-full"></div>

        {count > 2 && <span className="text-2xl">...</span>}

        {count > 1 && (
          <div className="w-6 h-28 bg-gray-300 rounded-full"></div>
        )}

      </div>

      <div className="text-center text-3xl">×</div>

      <div className="flex justify-center">

        <div className="flex">

          <div className="w-18 h-20 bg-gray-200"></div>
          <div className="w-18 h-20 bg-gray-400"></div>
          <div className="w-18 h-20 bg-gray-600"></div>

        </div>

      </div>

      <div className="text-center text-3xl">+</div>

      <div className="flex justify-center">

        <div className="w-6 h-40 bg-gray-300 rounded-full"></div>

      </div>

      <div className="text-center text-3xl">=</div>

      <div className="flex justify-center">

        <div className="flex">

          <div className="w-18 h-20 bg-gray-200"></div>
          <div className="w-18 h-20 bg-gray-400"></div>
          <div className="w-18 h-20 bg-gray-600"></div>

        </div>

      </div>

    </div>


    <div className="grid grid-cols-7 w-full max-w-5xl text-gray-400 text-center">

      <span>{count} Embedding Vectors</span>
      <span></span>
      <span>Q K V Weights (768,2304)</span>
      <span></span>
      <span>QKV Bias (2304)</span>
      <span></span>
      <span>QKV Matrix ({count},2304)</span>

    </div>

  </div>

</div>

  )
}