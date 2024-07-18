import { DirectMessage } from "../model/direct-message";
import { SendMessage } from "./send-message";

interface SendMessageListProps {
  messages: DirectMessage[];
}

export const SendMessageList = ({ messages }: SendMessageListProps) => {
  return (
    <div className=" flex flex-col ">
      {messages.map((message) => (
        <SendMessage key={message.id} message={message} />
      ))}
    </div>
  );
};
