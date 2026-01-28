"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, AlertCircle, Loader2, PlayCircle, Box, Webhook, MessageSquare, Terminal } from "lucide-react";

const StatusIcon = ({ status }: { status?: string }) => {
    if (status === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "error") return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === "pending") return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
    if (status === "running") return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
    return <PlayCircle className="w-4 h-4 text-slate-300" />;
};

const NodeIcon = ({ label, type }: { label: string, type: string }) => {
    const l = label.toLowerCase();
    if (l.includes("github") || l.includes("trigger")) return <Webhook className="w-5 h-5 text-indigo-500" />;
    if (l.includes("slack") || l.includes("message")) return <MessageSquare className="w-5 h-5 text-pink-500" />;
    if (l.includes("summary") || l.includes("llm")) return <Terminal className="w-5 h-5 text-purple-500" />;
    return <Box className="w-5 h-5 text-slate-500" />;
}

export const CustomNode = memo(({ data, selected }: NodeProps) => {
    const status = data.status || "idle";

    return (
        <div className={cn(
            "px-4 py-3 shadow-lg rounded-xl bg-card border-2 w-[250px] transition-all duration-200",
            selected ? "border-primary shadow-primary/20" : "border-border",
            status === "running" && "ring-2 ring-blue-400 ring-offset-2",
            status === "success" && "border-green-200 bg-green-50/30",
            status === "error" && "border-red-200 bg-red-50/30",
        )}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-3 !h-3" />

            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg bg-muted border border-border",
                    status === "success" && "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800",
                    status === "running" && "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800",
                )}>
                    <NodeIcon label={data.label || ""} type={data.type} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{data.label}</h3>
                    <p className="text-xs text-muted-foreground truncate">{data.description || "Configure this step..."}</p>
                </div>

                <div className="pt-1">
                    <StatusIcon status={status} />
                </div>
            </div>

            {/* Output Handle */}
            <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-3 !h-3" />
        </div>
    );
});

CustomNode.displayName = "CustomNode";
