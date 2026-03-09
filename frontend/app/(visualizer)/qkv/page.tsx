"use client"
//a for push
import { useRouter } from "next/navigation"
import QKVCalculation from "./qkvCalculation"

export default function QKVPage() {

  const router = useRouter()

  return (

    <div className="relative min-h-screen">

      <QKVCalculation />

      <div className="absolute top-1/2 left-0 w-full flex justify-between px-8 -translate-y-1/2">

        <button
          onClick={() => router.push("/embedding?step=2" + "&" + window.location.search.replace("?",""))}
          className="border px-4 py-2"
        >
          ← 
        </button>

        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search)
            params.set("step", "0")
            router.push("/attention?" + params.toString())
          }}
          className="border px-4 py-2">
        →
        </button>

      </div>

    </div>

  )
}