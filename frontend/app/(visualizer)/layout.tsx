export default function VisualizerLayout({
    children,
}: {
    children: React.ReactNode;
}){

    return (

        <>
        <header className="pl-8 pt-6 pb-6 border-b border-white space-y-2">

        <h1 className="text-3xl font-bold">

            Transformer Visualizer

        </h1>

        <p className="text-sm text-gray-400 font-semibold">

            VISUALIZING: Today , the weather is ___

        </p>

        </header>

        <main className='relative min-h-screen'>

        <div className="pl-8 pt-6 pb-6 space-y-2">

        <p className="text-sm text-gray-400 font-semibold">
        Phase 1: Embedding
        </p>

        <h2 className="text-xl font-bold" >

        Step: is hardcoded right now

        </h2>

        </div>

        {children}

        <aside className = "absolute right-12 top-32 w-[330px] rounded-2xl border border-white p-6">

        <p>
        Filler Note
        </p>

        </aside>

        </main>
            
        
        </>

    )
}