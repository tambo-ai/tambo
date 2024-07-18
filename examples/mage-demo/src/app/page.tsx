"use client";

import { HydraChat } from "hydra-ai";
import hydra from "./hydra-client";
import { Title } from "./title";

export default function Home() {
  return (
    <div
      className="flex flex-col h-screen  text-black p-4 justify-center items-center"
      style={{ backgroundColor: "#AAB7B5" }}
    >
      <Title />
      <div
        className="flex-grow overflow-y-auto  text-xs w-full max-w-xl text-black rounded-lg shadow-lg"
        style={{ backgroundColor: "#F0F0F0" }}
      >
        <HydraChat
          hydraClient={hydra}
          initialMessages={[
            {
              sender: "Hydra",
              message: `This is a demo social app made using Hydra. Try 'Show me people who use NextJS' or 'Draft a message to any react developers asking them to try out Hydra' 
                or 'Show me discussions about React'`,
              type: "text",
            },
          ]}
          inputBackgroundColor="white"
          inputTextColor="black"
        />
      </div>
    </div>
  );
}
