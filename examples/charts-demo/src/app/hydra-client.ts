import { HydraClient } from "hydra-ai";
import HydraLineGraph from "./components/line-graph";
import HydraPieChart from "./components/pie-chart";
import { getTransactions } from "./services/transactions-service";

const hydra = new HydraClient();

hydra.registerComponent(
  "PieChart",
  HydraPieChart,
  {
    data: '{ name: "string", value: "number" }[]',
  },
  getTransactions
);

hydra.registerComponent(
  "LineGraph",
  HydraLineGraph,
  {
    xValues: "string[]",
    series: "{ name: string; yValues: number[] }[]",
  },
  getTransactions
);

export default hydra;
