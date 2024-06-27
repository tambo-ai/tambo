import React from "react";

export interface RainChance {
  hourOrDay: string;
  rainChancePercent: number;
}

interface RainChartProps {
  data: RainChance[];
}

const RainChart: React.FC<RainChartProps> = ({ data }) => {
  const chartHeight = 48;

  return (
    <div className="p-6 rounded-lg my-4 bg-white text-black">
      <p>rain chance</p>
      <div className="overflow-x-auto flex">
        <div className="flex flex-col justify-between h-36 pr-2">
          <span className="text-sm text-gray-600">100%</span>
          <span className="text-sm text-gray-600">75%</span>
          <span className="text-sm text-gray-600">50%</span>
          <span className="text-sm text-gray-600">25%</span>
          <span className="text-sm text-gray-600">0%</span>
        </div>
        <div className="flex justify-between items-end h-48">
          {data.map((point, index) => (
            <div key={index} className="flex flex-col items-center h-full mx-2">
              <div className="flex flex-col justify-end bg-slate-300 w-2 h-full rounded-lg">
                <div
                  className="bg-blue-500 w-2 rounded-md"
                  style={{
                    height: `${
                      (point.rainChancePercent / 100) * chartHeight
                    }px`,
                  }}
                ></div>
              </div>
              <span className="h-12 mt-2 text-sm text-gray-600">
                {point.hourOrDay}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RainChart;
