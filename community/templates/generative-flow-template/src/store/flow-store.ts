import { create } from "zustand";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "Trigger: Start",
      description: "Initiates the workflow process",
    },
    position: { x: 250, y: 50 },
  },
  {
    id: "2",
    type: "custom",
    data: {
      label: "Action: Process Data",
      description: "Processes the input data",
    },
    position: { x: 250, y: 200 },
  },
  {
    id: "3",
    type: "custom",
    data: { label: "Action: Log Result", description: "Logs the final output" },
    position: { x: 250, y: 350 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));
