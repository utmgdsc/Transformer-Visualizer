export default function QkvCalculation () {
    return (

    <div className="flex flex-col items-center justify-center mt-16 space-y-16">

      <div className="flex items-center space-x-6 text-2xl font-semibold">

        <span className="text-6xl">Σ</span>

        <span>
          Embedding<sub>id</sub>
        </span>

        <span className="text-white">•</span>

        <span>
          Weights<sub>dj</sub>
        </span>

        <span className="text-white">+</span>

        <span>
          Bias<sub>j</sub>
        </span>
      </div>

      <div className="text-5xl">↓</div>

      <div className="flex items-center space-x-10">

        <div className="flex items-center space-x-6 -mt-8 ">

          <div className="flex items-end space-x-6">

            <div className="w-4 h-28 bg-gray-300 rounded-full"></div>

            <span className="text-2xl">...</span>

            <div className="w-4 h-28 bg-gray-300 rounded-full"></div>

          </div>
          
          <span className="text-2xl font-bold">×</span>
        </div>

        

        <div className="flex flex-col items-center space-y-3">

          <div className="flex">

            <div className="w-24 h-24 bg-gray-200"></div>

            <div className="w-24 h-24 bg-gray-400"></div>

            <div className="w-24 h-24 bg-gray-600"></div>

          </div>

          <p className="text-sm text-gray-400">Q K V Weights</p>

        </div>

        <span className="text-3xl font-bold text-white">+</span>

        <div className="flex flex-col items-center space-y-3">

          <div className="w-4 h-50 bg-gray-300 rounded-full"></div>

          <p className="text-sm text-gray-400">QKV Bias</p>

        </div>

        <span className="text-3xl font-bold">=</span>

        <div className="flex flex-col items-center space-y-3">

          <div className="flex">

            <div className="w-24 h-24 bg-gray-200"></div>

            <div className="w-24 h-24 bg-gray-400"></div>

            <div className="w-24 h-24 bg-gray-600"></div>

          </div>

          <p className="text-sm text-gray-400">QKV Matrix</p>

        </div>

      </div>

    </div>

    );

}