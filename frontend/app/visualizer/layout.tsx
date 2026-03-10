import { GeistSans } from "geist/font/sans";

interface ____VisualizerLayoutProps____{
    phase: string,
    step: string,
    children: React.ReactNode
}
function VisualizerLayout({phase, step, children}: ____VisualizerLayoutProps____) {
  return (
    <>
      <header className="pl-8 pt-6 pb-6 border-b border-white space-y-2">
        <h1 className="text-3xl font-bold">
          Transformer Visualizer
        </h1>
        <p className="text-sm text-gray-400 font-semibold">
          VISUALIZING: Today, the weather is ___
        </p>
      </header>
      <main className="relative h-[calc(100vh-120px)] overflow-hidden">
        <div className="pl-8 pt-6 pb-6 space-y-2">
          <p className="text-sm text-gray-400 font-semibold">
            Phase {phase}
          </p>
          <h2 className="text-xl font-bold">
            Step {step}
          </h2>
        </div>
        {children}
        <aside className="absolute right-12 top-32 w-[330px] rounded-2xl border border-white p-6">
          <p>
            Filler Note
          </p>
        </aside>
      </main>
    </>
  );
}
export default VisualizerLayout;