"use client";
import { useState } from "react";
import { Discussion } from "../model/discussion";

export interface DiscussionCardProps {
  discussion: Discussion;
}

export const DiscussionCard = ({ discussion }: DiscussionCardProps) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleToggle = () => {
    setIsSelected(!isSelected);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  return (
    <div>
      <div
        className="w-80 h-20 min-w-[200px] flex flex-row overflow-hidden items-center m-4 bg-white rounded-lg shadow-lg cursor-pointer"
        onClick={handleToggle}
      >
        <div className="bg-[#B5D3BF] w-[15%] h-full"></div>
        <div className="h-full flex flex-col items-start p-8 justify-between">
          <div className="text-md">{discussion.title}</div>
          <div className="text-blue-400">
            {discussion.messages.length} messages
          </div>
        </div>
        <div>{isSelected ? "v" : ">"}</div>
      </div>
      {isSelected && (
        <div className="w-80 min-w-[200px] m-4 p-8 bg-white rounded-lg shadow-lg">
          {discussion.messages.map((message) => (
            <div key={message.id} className="mb-4">
              <div className="flex flex-row text-gray-500">
                <div className="mr-3">{message.from}</div>
                <div className="text-xs ">
                  {formatDate(message.createdDateIso)}
                </div>
              </div>
              <div>{message.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
