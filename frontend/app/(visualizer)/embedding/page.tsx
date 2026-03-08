"use client"

import {useState} from "react"

import EmbeddingAddition from "./embeddingAddition";
import Token from "./tokenization";
import TokenEmbed from "./tokenEmbedding";
import { useSearchParams } from "next/navigation";
import {useRouter} from "next/navigation";

export default function EmbeddingPage() {

  const params = useSearchParams()
  const initalStep = Number(params.get("step")?? 0)

  const [step, setStep] = useState(initalStep)

  const router = useRouter()

  const screens = [
    <Token key={0} />,
    <TokenEmbed key={1} />,
    <EmbeddingAddition key={2} />
  ]

  return (

    <div className="relative min-h-screen">

    {screens[step]}

    <div className="absolute top-1/2 left-0 w-full flex justify-between px-8 -translate-y-1/2">

      <button
        onClick={() => setStep(step - 1)}
        disabled={step === 0}
        className="border px-4 py-2"
      >
        ←
      </button>

      <button
        onClick={() => {

          if (step === screens.length -1) {
            router.push("/qkv" + window.location.search)
          } else{
            setStep(step + 1)
          }
        }} className="border px-4 py-2"
      >
        →
      </button>

    </div>

  </div>

  )
}