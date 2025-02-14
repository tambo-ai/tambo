export interface ChatMessage {
  sender: "hydra" | "user" | "tool";
  message: string;
  additionalContext?: string;
}
