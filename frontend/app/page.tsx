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

    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">

      <h1 className="text-4xl font-bold mb-8">
        Transformer Visualizer
      </h1>

      <div className="flex flex-col items-center space-y-6">


        <div className="flex flex-col items-start">
          <label className="text-sm text-gray-400 mb-1">
            Walkthrough an example
          </label>

          <select
            className="bg-gray-200 text-black px-4 py-2 rounded w-[280px]"
            onChange={(e) => setSentence(e.target.value)}
          >
            <option value="">Select an example</option>
            <option value="Today the weather is">
              Today the weather is 
            </option>
          </select>
        </div>

        <span className="text-gray-400 text-sm">OR</span>

        <input
          className="bg-gray-200 text-black px-4 py-2 rounded w-[280px]"
          placeholder="Write your own sentence"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
        />

        <button
          onClick={startVisualizer}
          className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded w-[280px]"
        >
          Start
        </button>

      </div>

    </div>
  )
}