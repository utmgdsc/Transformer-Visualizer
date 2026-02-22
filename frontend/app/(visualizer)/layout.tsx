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

        <div className></div>
        
        </>

    )
}