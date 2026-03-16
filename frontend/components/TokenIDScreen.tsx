import FlowArrow from "./FlowArrow"

export default function TokenIDScreen({
  stepIndex,
  setStepIndex,
  inputText
}: {
  stepIndex: number
  setStepIndex: (n: number) => void
  inputText: string
}) {

  // Tokenize input
  const tokens =
    inputText.trim().length > 0
      ? inputText.split(/\s+/)
      : []

  // Fake vocabulary lookup (deterministic hash for demo)
  const tokenIDs = tokens.map((token) => {
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      hash = token.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 50000) + 10000
  })

  return (

    <div className="grid grid-cols-[2fr_1fr] gap-10">

      <div className="flex flex-col items-center gap-8">

        <div className="text-zinc-400 text-sm text-center">
          EACH TOKEN IS GIVEN A UNIQUE ID THAT CORRESPONDS TO A ROW IN THE EMBEDDING MATRIX
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">

          {tokens.map((token, i) => (
            <div
              key={i}
              className="min-w-[120px] px-5 py-3 border border-[#2a2a2e] rounded-lg flex flex-col items-center"
            >
              <div className="text-zinc-300">{token}</div>
              <div className="text-lg font-semibold">{tokenIDs[i]}</div>
            </div>
          ))}

        </div>


        <div className="flex flex-col items-center gap-4">

          <FlowArrow/>

          <div className="text-sm text-zinc-400 text-center">
            These IDs index into the embedding matrix
          </div>

          <div className="bg-[#151517] border border-[#2a2a2e] rounded-lg p-4 flex flex-col gap-2">

            <div className="text-xs text-zinc-500 mb-2">
              Embedding Matrix (100k × 768) — showing a tiny slice
            </div>

            {tokenIDs.map((id) => (

              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded bg-purple-900/20"
              >

                <div className="w-20 text-zinc-400 text-sm">
                  row {id}
                </div>

                <div className="flex gap-1">
                  {[...Array(8)].map((_, j) => (
                    <div
                      key={j}
                      className="w-5 h-4 bg-purple-500/70 rounded"
                    />
                  ))}
                </div>

                <div className="text-xs text-zinc-500 ml-2">
                  ...768 dims
                </div>

              </div>

            ))}

          </div>

        </div>

      </div>


      <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 flex flex-col">

        <div className="flex flex-col gap-4">

          <h2 className="text-xl font-semibold">
            Token IDs
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Each token maps to an integer index in the vocabulary (~100k tokens for modern LLMs).
            The model never sees raw text, only these numbers.
          </p>

          {tokens.length > 0 && (
            <div className="bg-[#1c1c1f] p-3 rounded text-sm font-mono">
              "{tokens[0]}" → {tokenIDs[0]}
            </div>
          )}

          <div className="border-l-2 border-purple-500 pl-4 text-zinc-400 text-sm">
            These IDs are used to select a row in the embedding matrix.
          </div>

        </div>

        <div className="flex justify-end mt-auto pt-6">

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