interface MessageHistoryProps {
  messages: string[];
}
export default function MessageHistory({ messages }: MessageHistoryProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {messages.map((message, index) => (
        <div key={index} className="p-4 m-2 rounded-md text-white">
          {message}
        </div>
      ))}
    </div>
  );
}
