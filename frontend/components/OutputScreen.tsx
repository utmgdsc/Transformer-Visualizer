"use client"

import { useState, useEffect } from "react"

export default function ProbabilitiesScreen({
  inputText
}: {
  inputText: string
}) {
  const [predictions, setPredictions] = useState<{ token: string; probability: number }[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [judgeResult, setJudgeResult] = useState<{score: number; conclusion: string; reason: string; passed: boolean} | null>(null)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)

  useEffect(() => {
    if (!inputText.trim()) return
    setSelectedToken(null)
    fetchPredictions(inputText)
  }, [inputText])

  async function fetchPredictions(text: string) {
    setLoading(true)
    setError(null)
    setJudgeResult(null)
    try {
      const res = await fetch("http://localhost:8000/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, temperature: 1.0, top_k: 5 })
      })
      if (!res.ok) throw new Error(`Predict failed: ${res.status}`)
      const data = await res.json()
      setPredictions(data.next_token_probabilities)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed")
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const displaySentence = inputText.trim()
  const activeToken = selectedToken ?? predictions[0]?.token ?? ""

  async function fetchJudge() {
    setJudgeLoading(true)
    setJudgeError(null)
    setJudgeResult(null)
    try {
      const res = await fetch("http://localhost:8000/v1/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: inputText, generated_text: activeToken.trim() })
      })
      if (!res.ok) throw new Error(`Judge failed: ${res.status}`)
      const data = await res.json()
      setJudgeResult(data)
    } catch (err) {
      setJudgeError(err instanceof Error ? err.message : "Judge failed")
    } finally {
      setJudgeLoading(false)
    }
  }

  return (
    <div className="flex w-full gap-10">

      <div className="flex-1 flex flex-col items-center">

        <div className="text-zinc-400 text-base mb-8 tracking-wide">
          PREDICT NEXT WORD
        </div>

        {/* Sentence with predicted word highlighted */}
        <div className="text-lg text-zinc-300 mb-10 text-center">
          {displaySentence}{" "}
          {activeToken && (
            <span className="text-purple-400 font-medium">{activeToken.trim()}</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse mb-6">
            Predicting...
          </div>
        )}

        {!loading && predictions.length > 0 && (
          <>
            {/* Probability bars */}
            <div className="w-full max-w-md flex flex-col gap-3 mb-10">
              {predictions.map((item, i) => {
                const isActive = (selectedToken ?? predictions[0].token) === item.token
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedToken(item.token)}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div className={`w-28 text-sm transition ${
                      isActive ? "text-purple-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}>
                      {item.token.trim()}
                    </div>

                    <div className="flex-1 h-2 bg-[#1c1c22] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isActive ? "bg-purple-500" : "bg-zinc-600 group-hover:bg-zinc-500"
                        }`}
                        style={{ width: `${item.probability * 100}%` }}
                      />
                    </div>

                    <div className="text-xs text-zinc-400 w-12 text-right">
                      {(item.probability * 100).toFixed(1)}%
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Possible continuations */}
            <div className="w-full max-w-md flex flex-col gap-3">
              <div className="text-sm text-zinc-500 mb-2">
                Possible continuations
              </div>
              {predictions.map((item, i) => {
                const isActive = (selectedToken ?? predictions[0].token) === item.token
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedToken(item.token)}
                    className={`text-sm px-4 py-2 rounded-lg border text-left transition ${
                      isActive
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-[#2a2a2e] text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {displaySentence}{" "}
                    <span className="font-medium">{item.token.trim()}</span>
                    <span className="ml-2 text-xs text-zinc-400">
                      ({(item.probability * 100).toFixed(1)}%)
                    </span>
                  </button>
                )
              })}
            </div>
            
            {/* Hallucination Analysis */}
            <div className="w-full max-w-md mt-6 flex flex-col gap-3">
              <div className="text-sm text-zinc-500 mb-2">Hallucination Analysis</div>

              <button
                onClick={fetchJudge}
                disabled={judgeLoading || !activeToken}
                className="px-4 py-2 rounded-lg border border-[#2a2a2e] text-sm text-zinc-300 hover:border-purple-500 hover:text-purple-300 transition disabled:opacity-50"
              >
                {judgeLoading ? "Analyzing..." : "Analyze for Hallucination"}
              </button>

              {judgeError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {judgeError}
                </div>
              )}

              {judgeResult && (
                <div className="flex flex-col gap-2 p-4 rounded-lg border border-[#2a2a2e] bg-[#111114]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Risk:</span>
                    <span className={`text-sm font-medium ${
                      judgeResult.conclusion === "low" ? "text-green-400" :
                      judgeResult.conclusion === "medium" ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                      {judgeResult.conclusion.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {judgeResult.reason}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* Right panel */}
      <div className="w-[320px] bg-[#111114] border border-[#2a2a2e] rounded-2xl p-6 flex flex-col">
        <div>
          <div className="text-lg font-semibold mb-4">Next Token Prediction</div>

          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            The model uses the final representation of the last token to
            predict what word comes next.
          </p>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Click any word to see how the sentence would continue with that prediction.
          </p>
        </div>
      </div>

    </div>
  )
}