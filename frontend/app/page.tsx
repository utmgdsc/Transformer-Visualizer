"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";

const SENTENCES: Record<string, string> = {
  apple: "Today, the weather is",
  banana: "Hello, how are you doing",
  blueberry: "Transformers are interesting because",
  grapes: "Machine learning is the",
}

export function SentenceSelector({ onSelect }: { onSelect: (sentence: string) => void }) {
  return (
    <Select onValueChange={(value) => onSelect(SENTENCES[value])}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Start with a sentence..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sentences</SelectLabel>
          <SelectItem value="apple">
            <div><span>Today, the weather is </span><span className="text-[#FF0004]">...</span></div>
          </SelectItem>
          <SelectItem value="banana">
            <div><span>Hello, how are you doing </span><span className="text-[#FF0004]">...</span></div>
          </SelectItem>
          <SelectItem value="blueberry">
            <div><span>Transformers are interesting because </span><span className="text-[#FF0004]">...</span></div>
          </SelectItem>
          <SelectItem value="grapes">
            <div><span>Machine learning is the </span><span className="text-[#FF0004]">...</span></div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function LandingScreen({ onStart, sentence, setSentence }: { 
  onStart: () => void
  sentence: string
  setSentence: (s: string) => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-6xl font-bold">Transformer Visualizer</h1>
        <div className="flex flex-col items-center gap-4 w-full">
          <SentenceSelector onSelect={setSentence} />
          <small>OR</small>
          <Input 
            placeholder="Write your own sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
          <Button className="w-full" onClick={onStart}>Start</Button>
        </div>
      </div>
    </div>
  )
}

function TokenizationScreen({ 
  sentence, 
  tokens, 
  onNext 
}: { 
  sentence: string
  tokens: string[]
  onNext: () => void
}) {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-6 border-b pb-6"> 
        <div>
          <h1 className="text-4xl text-gray-400 font-bold">Transformer Visualizer</h1>
          <div>
            <span className="text-sm">VISUALIZING: </span>
            <span className="text-sm text-[#FF0004]">{sentence}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 mt-12">
        <p className="text-[#FF0004] text-2xl font-semibold">{sentence}</p>

        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-black dark:bg-white" />
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black dark:border-t-white" />
        </div>

        <div className="border-2 border-black dark:border-white px-8 py-3 rounded-md">
          <p className="text-sm font-semibold tracking-widest uppercase">Tokenizer</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-px h-16 bg-black dark:bg-white" />
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black dark:border-t-white" />
        </div>

        <div className="flex gap-2">
          {tokens.map((token, i) => (
            <div key={i} className="border border-black dark:border-white px-3 py-2 text-sm rounded-sm">
              {token}
            </div>
          ))}
        </div>

        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}

function TokenIDScreen({ sentence, tokens, tokenIds, onNext }: { 
  sentence: string
  tokens: string[]
  tokenIds: number[]
  onNext: () => void
}) {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-6 border-b pb-6"> 
        <h1 className="text-4xl text-gray-400 font-bold">Transformer Visualizer</h1>
        <div>
          <span className="text-sm">VISUALIZING: </span>
          <span className="text-sm text-[#FF0004]">{sentence}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">

        {/* tokens row */}
        {/* tokens row */}
        <div className="flex gap-6">
          {tokens.map((token, i) => (
            <div key={i} className="border border-black dark:border-white text-sm rounded-sm w-[72px] h-[36px] flex items-center justify-center">
              {token}
            </div>
          ))}
        </div>

        {/* single arrow down to lookup table */}
        <div className="flex flex-col items-center">
          <div className="w-px h-10 bg-black dark:bg-white" />
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black dark:border-t-white" />
        </div>

        <div 
          className="border-2 border-black dark:border-white rounded-md flex items-center justify-center py-3"
          style={{ width: `${tokens.length * 120 + (tokens.length - 1) * 24}px` }}
        >
          <p className="text-sm font-semibold tracking-widest uppercase">Lookup Table</p>
        </div>

        {/* arrows down to each ID */}
        <div className="flex gap-6">
          {tokens.map((_, i) => (
            <div key={i} className="flex flex-col items-center w-[72px]">
              <div className="w-px h-10 bg-black dark:bg-white" />
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black dark:border-t-white" />
            </div>
          ))}
        </div>

        {/* token ID boxes - same fixed width as tokens */}
        <div className="flex gap-6">
          {tokenIds.map((id, i) => (
            <div key={i} className="border border-black dark:border-white text-sm rounded-sm w-[72px] h-[250px] flex items-center justify-center text-gray-500">
              {id}
            </div>
          ))}
        </div>

        <Button className="mt-4" onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}

export default function Home() {
  const [sentence, setSentence] = useState("");
  const [tokens, setTokens] = useState<string[]>([])
  const [screen, setScreen] = useState("Home")
  const [tokenIds, setTokenIds] = useState<number[]>([])

async function handleStart() {
  const response = await fetch("http://localhost:8000/v1/tokenize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: sentence })
  })
  const data = await response.json()
  setTokens(data.tokens)
  setTokenIds(data.token_ids)
  setScreen("Tokenization")
}

  if (screen === "Tokenization") {
    return (
      <TokenizationScreen
        sentence={sentence}
        tokens={tokens}
        onNext={() => setScreen("TokenIDs")}
      />
    )
  }

if (screen === "TokenIDs") {
  return (
    <TokenIDScreen
      sentence={sentence}
      tokens={tokens}
      tokenIds={tokenIds}
      onNext={() => setScreen("Home")}
    />
  )
}

  return (
    <LandingScreen 
      onStart={handleStart}
      sentence={sentence}
      setSentence={setSentence}
    />
  )
}