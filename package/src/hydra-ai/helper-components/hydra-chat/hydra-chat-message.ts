export default interface HydraChatMessage {
  sender: string;
  message?: string;
  type: "text" | "component";
  component?: React.ReactElement;
}
