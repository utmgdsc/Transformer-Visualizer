export default function FlowArrow() {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
  
        <div className="h-10 w-[2px] bg-zinc-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500 to-transparent animate-pulse"/>
        </div>
  
        <div className="text-zinc-500 text-2xl">
          ↓
        </div>
  
      </div>
    )
  }