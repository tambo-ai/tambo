import React from "react";

interface RainChartProps {
  data: { hour: string; rainAmountInches: number }[];
}

const RainChart: React.FC<RainChartProps> = ({ data }) => {
  const maxRainAmount = 1;
  const chartHeight = 48;

  return (
    <div className="p-6 rounded-lg my-4 bg-white text-black">
      <p>rain amounts</p>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-end h-48">
          {data.map((point, index) => (
            <div key={index} className="flex flex-col items-center h-full mx-2">
              <div className="flex flex-col justify-end bg-slate-300 w-2 h-full rounded-lg">
                <div
                  className="bg-blue-500 w-2 rounded-md"
                  style={{
                    height: `${
                      (point.rainAmountInches / maxRainAmount) * chartHeight
                    }px`,
                  }}
                ></div>
              </div>
              <span className="mt-2 text-sm text-gray-600">{point.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RainChart;
