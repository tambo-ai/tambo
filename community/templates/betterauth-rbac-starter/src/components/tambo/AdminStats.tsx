"use client";

import { AccessDenied } from "./AccessDenied";
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";

interface AdminStatsProps {
    status?: "optimal" | "warning" | "critical" | "denied";
    data?: {
        cpu?: string;
        disk?: string;
        bandwidth?: string;
        uptime?: string;
    };
    message?: string;
}

export function AdminStats({ status, data, message }: AdminStatsProps) {
    if (status === "denied") {
        return <AccessDenied message={message} />;
    }

    if (!data) return null;

    return (
        <div className="w-full max-w-[350px] bg-zinc-900/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 overflow-hidden font-sans mx-auto text-white">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-zinc-400" />
                    <span className="font-bold text-sm tracking-tight text-zinc-100">SYSTEM HEALTH</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    status === "warning" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                    {status || "OPTIMAL"}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/5">
                <div className="bg-zinc-900/50 p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Cpu size={12} /> Processor
                    </div>
                    <div className="font-mono text-xl font-medium tracking-tight text-zinc-100">
                        {data.cpu || "--"}
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-1">
                        <HardDrive size={12} /> Storage
                    </div>
                    <div className="font-mono text-xl font-medium tracking-tight text-zinc-100">
                        {data.disk || "--"}
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Wifi size={12} /> Network
                    </div>
                    <div className="font-mono text-xl font-medium tracking-tight text-zinc-100">
                        {data.bandwidth || "--"}
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Activity size={12} /> Uptime
                    </div>
                    <div className="font-mono text-xl font-medium tracking-tight text-zinc-100">
                        {data.uptime || "--"}
                    </div>
                </div>
            </div>
        </div>
    );
}
