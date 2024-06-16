import { DynamicMessage } from "../model/dynamic-message";
import ProfilePhotosRow from "../components/profile-photos-row";

interface DynamicMessageHistoryProps {
  messages: DynamicMessage[];
}
export default function DynamicMessageHistory({
  messages,
}: DynamicMessageHistoryProps) {
  return (
    <div className="flex flex-col items-center justify-bottom w-full">
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className="p-4 m-2 rounded-md text-white w-full h-full text-center"
          >
            {message.message}
            {message.type === "profile_photos_row" && (
              <ProfilePhotosRow {...message.componentData} />
            )}
          </div>
        );
      })}
    </div>
  );
}
