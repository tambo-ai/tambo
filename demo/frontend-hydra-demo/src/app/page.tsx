"use client";

import DynamicChatbox from "./dynamic-chatbox/dynamic-chatbox";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 justify-center items-center">
      <div className="flex-grow overflow-y-auto w-full max-w-md">
        <DynamicChatbox />
      </div>
    </div>
  );
}
