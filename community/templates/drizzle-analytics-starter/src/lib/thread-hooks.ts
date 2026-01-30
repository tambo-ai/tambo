import { useTambo } from "@tambo-ai/react";

export const useThreadScroll = () => {
  const { thread } = useTambo();
  return thread?.messages;
};