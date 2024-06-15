"use client";

import DynamicChatbox from "./dynamic-chatbox/dynamic-chatbox";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          maxWidth: 1100,
        }}
      >
        <DynamicChatbox />
      </div>
    </main>
  );
}
