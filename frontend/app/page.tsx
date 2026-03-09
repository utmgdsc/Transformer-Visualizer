"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {

  const [sentence, setSentence] = useState("")
  const router = useRouter()

  function startVisualizer() {
    if (!sentence.trim()) return
    router.push(`/embedding?text=${encodeURIComponent(sentence)}`)
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">

      <div className="w-full max-w-md">

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight">
            Transformer Visualizer
          </h1>

          <p className="text-gray-400 mt-3 text-sm">
            Explore how transformers process language
          </p>
        </div>


        <div className="flex flex-col gap-6">

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">
              Walkthrough an example
            </label>

            <select
              className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-md w-full text-white focus:outline-none"
              onChange={(e) => setSentence(e.target.value)}
            >
              <option value="">Select an example</option>
              <option value="Today the weather is">
                Today the weather is
              </option>
            </select>
          </div>


          <div className="text-center text-gray-500 text-sm">
            OR
          </div>


          <input
            className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-md w-full text-white placeholder-gray-500 focus:outline-none"
            placeholder="Write your own sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />


          <button
            onClick={startVisualizer}
            className="bg-orange-500 hover:bg-orange-600 transition px-6 py-2 rounded-md w-full font-semibold"
          >
            Start Visualizer
          </button>

        </div>

      </div>

    </div>
  )
}