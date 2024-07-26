"use client";

import { HydraChat } from "hydra-ai";
import React from "react";
import hydra from "./hydra-client";
import { Title } from "./title";

export default function Home() {
  const [hydraComponent, setHydraComponent] =
    React.useState<React.ReactElement | null>(null);

  const handleHydraComponent = (component: React.ReactElement) => {
    setHydraComponent(component);
  };

  return (
    <div
      className="h-[100dvh] min-h-[100dvh] text-black p-4 flex flex-col"
      style={{ backgroundColor: "#162E3B" }}
    >
      <div className="text-white w-full max-w-6xl m-auto">
        <Title />
      </div>
      <div className="flex flex-row flex-wrap-reverse h-full min-h-[60%] text-black p-4 justify-center items-center">
        <div className="h-[60%] w-full max-w-xl flex-grow overflow-y-auto text-sm  text-[#B5D3BF] rounded-lg p-2 md:p-4 ">
          <HydraChat
            hydraClient={hydra}
            initialMessages={[
              {
                sender: "Hydra",
                message: `I am a Hydra-powered AI agent that has access to demo transaction data, with the ability to show charts. Try asking about your monthly spending.`,
                type: "text",
              },
            ]}
            inputBackgroundColor="#050C0F"
            inputTextColor="white"
            aiMessageColor="#B5D3BF"
            userMessageColor="white"
            handleComponent={handleHydraComponent}
            loadingIconColor="white"
          />
        </div>

        <div>{hydraComponent}</div>
      </div>
    </div>
  );
}
