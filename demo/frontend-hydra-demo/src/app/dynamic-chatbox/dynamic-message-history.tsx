import LineGraph from "../components/line-graph";
import { DynamicMessage } from "../model/dynamic-message";

interface DynamicMessageHistoryProps {
  messages: DynamicMessage[];
}
export default function DynamicMessageHistory({
  messages,
}: DynamicMessageHistoryProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-h-[80%]">
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
    </div>
  );
}
