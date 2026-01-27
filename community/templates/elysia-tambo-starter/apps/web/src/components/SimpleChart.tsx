import { BarChart3 } from "lucide-react";

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  title?: string;
  data: DataPoint[];
}

export function SimpleChart({ title = "Chart", data = [] }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="p-6 border border-slate-200/60 rounded-2xl bg-white shadow-sm w-full max-w-lg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm tracking-tight text-slate-900">
            {title}
          </h3>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Analytics
        </div>
      </div>

      <div className="flex items-end gap-4 h-48 pt-4 border-b border-slate-100/60 pb-4">
        {data.map((point, index) => {
          const heightPercentage = Math.round((point.value / maxValue) * 100);
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-3 group h-full justify-end"
            >
              <div
                className="w-full max-w-[24px] bg-slate-900 rounded-lg hover:bg-slate-700 transition-all relative animate-in slide-in-from-bottom-4 duration-500 shadow-sm"
                style={{
                  height: `${Math.max(heightPercentage, 4)}%`,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl pointer-events-none z-10">
                  {point.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-start gap-4 mt-4">
        {data.map((point, index) => (
          <div
            key={index}
            className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate"
            title={point.label}
          >
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}
