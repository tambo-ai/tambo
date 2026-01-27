import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";

interface NotificationCardProps {
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
}

export function NotificationCard({
  type,
  title,
  message,
}: NotificationCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: "bg-white",
      border: "border-slate-200/60",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      accent: "bg-emerald-500",
    },
    warning: {
      bg: "bg-white",
      border: "border-slate-200/60",
      icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
      accent: "bg-amber-500",
    },
    error: {
      bg: "bg-white",
      border: "border-slate-200/60",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      accent: "bg-red-500",
    },
    info: {
      bg: "bg-white",
      border: "border-slate-200/60",
      icon: <Info className="h-4 w-4 text-slate-600" />,
      accent: "bg-slate-600",
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`p-5 rounded-2xl border ${style.border} ${style.bg} flex gap-4 w-full max-w-md relative shadow-sm overflow-hidden group hover:shadow-md transition-all`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent} opacity-20`}
      />
      <div className="flex-shrink-0 mt-0.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
        {style.icon}
      </div>
      <div className="flex-1 pr-6">
        <h4 className="font-semibold text-sm text-slate-900 mb-0.5 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {message}
        </p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
