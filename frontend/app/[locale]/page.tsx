"use client"

import { useState, useEffect } from "react"

import TokenizationScreen from "@/components/TokenizationScreen"
import TokenIDScreen from "@/components/TokenIDScreen"
import Embedding from "@/components/Embedding"
import QKVScreen from "@/components/QKVScreen"
import SelfAttentionScreen from "@/components/SelfAttentionScreen"
import AttentionOutScreen from "@/components/AttentionOutScreen"
import MLPScreen from "@/components/MLPResidual"
import ProbabilitiesScreen from "@/components/OutputScreen"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"

import CalculatingProbScreen from "@/components/CalculatingProb"

const localeToLanguage: Record<string, string> = {
  en: "English",
  fr: "French",
  zh: "Chinese",
}

const languageToLocale: Record<string, string> = {
  English: "en",
  French: "fr",
  Chinese: "zh",
}

const localeToBackendLang: Record<string, string> = {
  en: "en",
  fr: "fr",
  zh: "zh",
}

export default function Home() {

  const steps = [
    "Tokenization",
    "Token IDs",
    "Embeddings",
    "QKV",
    "Self-Attention",
    "Attention Out",
    "MLP",
    "Calculating the Probabilities",
    "Output"
  ]

  const locale = useLocale()

  const [stepIndex, setStepIndex] = useState(0)
  const [layer, setLayer] = useState(1)
  const [head, setHead] = useState(0)
  const [inputText, setInputText] = useState("The transformer model processes")
  const [runSignal, setRunSignal] = useState(0)
  const [nLayers, setNLayers] = useState(12)
  const [nHeads, setNHeads] = useState(12)
  const [dModel, setDModel] = useState(768)
  const [vocabSize, setVocabSize] = useState(50257)
  const [modelName, setModelName] = useState("GPT-2")

  const router = useRouter()
  const pathname = usePathname()

  // Derive the display language from the current locale
  const language = localeToLanguage[locale] ?? "English"
  const backendLang = localeToBackendLang[locale] ?? "en"

  // Fetch model info whenever locale changes
  useEffect(() => {
    fetch(`http://localhost:8000/v1/model-info?language=${backendLang}`)
      .then(r => r.json())
      .then(d => {
        setNLayers(d.n_layers)
        setNHeads(d.n_heads)
        setDModel(d.d_model)
        setVocabSize(d.n_vocab)
        setModelName(d.model_name)
        setLayer(1)
      })
      .catch(console.error)
  }, [locale])

  const handleLanguageChange = (newLanguage: string) => {
    const newLocale = languageToLocale[newLanguage] ?? "en"
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <main className="min-h-screen bg-[#0f0f10] text-white p-6 flex flex-col gap-6">

      <div className="flex items-center gap-4">

        <div className="text-lg font-semibold text-zinc-200 whitespace-nowrap">
          Transformer Visualizer
        </div>

        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl px-4 py-3 outline-none"
        />

        <button
          onClick={() => {
            setStepIndex(0)
            setRunSignal(prev => prev + 1)
          }}
          className="bg-[#2a2a2e] px-6 py-3 rounded-xl border border-[#3a3a3f] hover:bg-[#333338]"
        >
          ▶ Run
        </button>

        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-[#1c1c1f] border border-[#2a2a2e] rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option>English</option>
          <option>French</option>
          <option>Chinese</option>
        </select>

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setLayer(Math.max(1, layer - 1))}
            className="px-2 py-1 text-sm bg-[#1c1c1f] border border-[#2a2a2e] rounded hover:bg-[#2a2a2e]"
          >◀</button>
          <div className="text-sm text-zinc-300 px-3">Layer {layer} / {nLayers}</div>
          <button
            onClick={() => setLayer(Math.min(nLayers, layer + 1))}
            className="px-2 py-1 text-sm bg-[#1c1c1f] border border-[#2a2a2e] rounded hover:bg-[#2a2a2e]"
          >▶</button>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-8">

        <div className="flex flex-col pt-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  i < stepIndex ? "bg-green-500 border-green-500" : i === stepIndex ? "border-purple-500" : "border-[#2a2a2e]"
                }`}>
                  {i < stepIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                {i !== steps.length - 1 && (
                  <div className={`w-[2px] h-10 mt-1 ${i < stepIndex ? "bg-green-500" : "bg-[#2a2a2e]"}`} />
                )}
              </div>
              <button
                onClick={() => setStepIndex(i)}
                className={`text-sm text-left transition ${
                  i === stepIndex ? "text-white" : i < stepIndex ? "text-green-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >{s}</button>
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {stepIndex === 0 && <TokenizationScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} runSignal={runSignal} vocabSize={vocabSize} modelName={modelName} />}
          {stepIndex === 1 && <TokenIDScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} dModel={dModel} vocabSize={vocabSize} modelName={modelName} />}
          {stepIndex === 2 && <Embedding stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} dModel={dModel} />}
          {stepIndex === 3 && <QKVScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} layer={layer} setLayer={setLayer} nHeads={nHeads} dModel={dModel} />}
          {stepIndex === 4 && <SelfAttentionScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} layer={layer} head={head} setHead={setHead} nHeads={nHeads} modelName={modelName} />}
          {stepIndex === 5 && <AttentionOutScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} layer={layer} head={head} nHeads={nHeads} dModel={dModel} modelName={modelName} />}
          {stepIndex === 6 && <MLPScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} layer={layer} head={head} nHeads={nHeads} dModel={dModel} />}
          {stepIndex === 7 && <CalculatingProbScreen stepIndex={stepIndex} setStepIndex={setStepIndex} inputText={inputText} nHeads={nHeads} dModel={dModel} vocabSize={vocabSize} />}
          {stepIndex === 8 && <ProbabilitiesScreen inputText={inputText} />}
        </div>

      </div>

    </main>
  )
}