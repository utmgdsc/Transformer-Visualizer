"use client"

import { useSearchParams } from "next/navigation";

export default function VisualizerLayout({
    children,
}: {
    children: React.ReactNode;
}){

    const params = useSearchParams()
    const text = params.get("text")

    return (

        <>
        <header className="pl-8 pt-6 pb-6 border-b border-white space-y-2">

        <h1 className="text-3xl font-bold">

            Transformer Visualizer

        </h1>

        <p className="text-sm text-gray-400 font-semibold">

            VISUALIZING: {text + " ______"}

        </p>

        </header>

        <main className='relative min-h-screen'>

        <div className="pl-8 pt-5 space-y-2">

        </div>

        {children}


        </main>
            
        
        </>

    )
}