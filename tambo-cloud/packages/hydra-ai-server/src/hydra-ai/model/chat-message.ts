export interface ChatMessage {
  sender: "hydra" | "user";
  message: string;
  additionalContext?: string;
}
