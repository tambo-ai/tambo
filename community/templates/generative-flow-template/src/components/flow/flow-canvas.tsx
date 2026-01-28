"use client";

import React, { useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flow-store";

import { CustomNode } from "./custom-node";

interface FlowCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes?: Node[];
  edges?: Edge[];
}

export function FlowCanvas({
  className,
  nodes: propNodes,
  edges: propEdges,
  ...props
}: FlowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
  } = useFlowStore();

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  useEffect(() => {
    if (propNodes) {
      const styledNodes = propNodes.map((n) => ({
        ...n,
        type: "custom",
        data: { ...n.data, label: n.data.label || n.id },
      }));
      setNodes(styledNodes);
    }
  }, [propNodes, setNodes]);

  useEffect(() => {
    if (propEdges) {
      setEdges(propEdges);
    }
  }, [propEdges, setEdges]);

  return (
    <div
      className={cn("flex-1 h-full w-full bg-background relative", className)}
      {...props}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background gap={12} size={1} />
        <Controls />
        <MiniMap />
        <Panel
          position="top-left"
          className="bg-card/80 p-2 rounded shadow backdrop-blur border border-border m-2"
        >
          <div className="text-xs font-mono text-muted-foreground">
            AutoFlow Engine v0.1
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
