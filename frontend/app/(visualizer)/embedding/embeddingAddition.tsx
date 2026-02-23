export default function EmbeddingAddition() {
    return (
<div className=" px-8">
  <div className="max-w-5xl ml-8">
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-y-8 gap-x-8">

      <div className="flex flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold">Token Embeddings</h3>
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>id 21</p>
      </div>

      <div className="text-4xl font-bold text-center">+</div>

      <div className="flex flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold">Positional Encoding</h3>
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>0</p>
      </div>

      <div className="text-4xl font-bold text-center">=</div>

      <div className="flex flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold">Result</h3>
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>768 size vector</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>id 22–26</p>
      </div>

      <div className="text-4xl font-bold text-center">+</div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>1–5</p>
      </div>

      <div className="text-4xl font-bold text-center">=</div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-48 bg-white/70 rounded-full" />
        <p>768 size vector</p>
      </div>

    </div>
  </div>
</div>
    );
  }