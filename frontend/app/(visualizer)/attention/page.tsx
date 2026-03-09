"use client"

import {useState} from "react"


import { useSearchParams } from "next/navigation";
import {useRouter} from "next/navigation";
import DotProductScreen from "./dotProductScreen";
import ScalingMask from "./scalingMaskScreen";
import AttentionScore from "./attentionScoreScreen";

export default function AttentionPage() {

  const params = useSearchParams()
  const initalStep = Number(params.get("step")?? 0)

  const [step, setStep] = useState(initalStep)

  const router = useRouter()

  const screens = [
    <DotProductScreen key={0} />,
    <ScalingMask key={1} />,
    <AttentionScore key={2} />
  ]

  return (

    <div className="relative min-h-screen">

    {screens[step]}

    <div className="absolute top-[65%] left-0 w-full flex justify-between px-8 -translate-y-1/2">

      <button
        onClick={() => {
            if (step == 0) {
              router.push("/qkv" + window.location.search)
            } else {
              setStep(step - 1)
            }
          }} className="border px-4 py-2"
      >
        ←
      </button>

      <button
         onClick={() => {
              setStep(step + 1)}} className="border px-4 py-2"
      >
        →
      </button>

    </div>

  </div>

  )
}