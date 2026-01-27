import { Check } from "lucide-react";

interface PricingTableProps {
  planName: string;
  price: string;
  period?: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
}

export function PricingTable({
  planName,
  price,
  period = "/month",
  features = [],
  isPopular = false,
  ctaText = "Get Started",
}: PricingTableProps) {
  return (
    <div
      className={`relative p-8 rounded-3xl border w-full max-w-sm bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${
        isPopular
          ? "border-slate-900 ring-1 ring-slate-900"
          : "border-slate-200/60"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-8 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
          Most Popular
        </span>
      )}

      <div className="mb-8">
        <h3 className="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-[0.2em]">
          {planName}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold text-slate-900 tracking-tight">
            {price}
          </span>
          <span className="text-slate-400 text-xs font-medium">{period}</span>
        </div>
      </div>

      <ul className="space-y-4 mb-10">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
            <div className="mt-1 bg-slate-100 p-0.5 rounded-full">
              <Check className="h-3 w-3 text-slate-900" />
            </div>
            <span className="font-medium text-slate-600">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-3 px-6 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-sm ${
          isPopular
            ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
            : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200"
        }`}
      >
        {ctaText}
      </button>
    </div>
  );
}
