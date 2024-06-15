<<<<<<< HEAD
import LineGraph from "../components/line-graph";
=======
import { TimeSeriesData } from "../../../components/graph";
>>>>>>> main
import { DynamicMessage } from "../model/dynamic-message";

interface DynamicMessageHistoryProps {
  messages: DynamicMessage[];
}
export default function DynamicMessageHistory({
  messages,
}: DynamicMessageHistoryProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-h-[80%]">
<<<<<<< HEAD
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className="p-4 m-2 rounded-md text-white w-full h-full text-center"
          >
            {message.message}
            {message.type === "graph" && (
              <LineGraph {...message.componentData} />
            )}
          </div>
        );
      })}
=======
      {messages.map((message, index) => (
        <div key={index} className="p-4 m-2 rounded-md text-white">
          {message.message}
          {message.type === "graph" && (
            <TimeSeriesData {...message.componentData} />
          )}
        </div>
      ))}
>>>>>>> main
    </div>
  );
}
