import FlowArrow from "./FlowArrow"

export default function TokenizationScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {

  // Tokenization (simple word split for now)
  const tokens = inputText.trim().length > 0
    ? inputText.split(/\s+/)
    : []

  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-500 text-sm w-full text-left">
          INPUT TEXT
        </div>

        <div className="italic text-3xl text-zinc-200 text-center max-w-3xl">
          "{inputText}"
        </div>

        <FlowArrow/>

        <div className="text-zinc-400 text-sm text-center">
          TOKENS ({tokens.length})
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

          {tokens.map((token, i) => (
            <div
              key={i}
              className="min-w-[110px] px-4 py-2 border border-[#2a2a2e] rounded-lg text-center"
            >
              {token}
            </div>
          ))}

        </div>

      </div>


      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col gap-4">

        <h2 className="text-xl font-semibold">
          Tokenization
        </h2>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Your text is split into tokens, the basic units the model reads.
          Usually one word per token, but punctuation and rare words can split further.
        </p>

        <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
          Input → [t1, t2, … t{tokens.length}]
        </div>

        <div className="flex justify-end pt-6">

          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            className="border border-[#2a2a2e] px-5 py-2 rounded-lg hover:bg-[#1c1c1f]"
          >
            Next →
          </button>

        </div>

      </div>

    </div>

  )
}