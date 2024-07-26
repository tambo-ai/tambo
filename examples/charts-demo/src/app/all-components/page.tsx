import HydraLineGraph from "../components/line-graph";
import HydraPieChart from "../components/pie-chart";
import { Transaction } from "../model/transaction";
import { sampleTransactions } from "../services/transactions-service";

export default function AllComponentsPage() {
  const transactionsToPieChartData = (transactions: Transaction[]) => {
    return transactions.map((t) => {
      return { name: t.category, value: t.dollarAmount };
    });
  };

  const transactionsToLineGraphData = (transactions: Transaction[]) => {
    const xValues = transactions.map((t) => t.dateIso);
    const series = [
      {
        name: "Expenses",
        yValues: transactions
          .filter((t) => t.type === "expense")
          .map((t) => t.dollarAmount),
      },
    ];
    return { xValues, series };
  };

  const pieChartData = transactionsToPieChartData(
    sampleTransactions.slice(3, 8)
  );
  const lineGraphData = transactionsToLineGraphData(
    sampleTransactions.filter((t) => t.type === "expense")
  );

  return (
    <div
      className="flex flex-col min-h-[100dvh] text-white p-4 justify-center items-center"
      style={{ backgroundColor: "#162E3B" }}
    >
      <div className="p-3 text-center flex flex-col justify-center items-center">
        <div className="text-sm">
          These are the components Hydra knows about in this demo:
        </div>
        <div className={"m-2"}>
          <div className="text-sm">Pie Chart</div>
          <HydraPieChart data={pieChartData} />
        </div>
        <div className={"m-2"}>
          <div className="text-sm">Line Graph</div>
          <HydraLineGraph
            xValues={lineGraphData.xValues}
            series={lineGraphData.series}
          />
        </div>
      </div>
    </div>
  );
}
