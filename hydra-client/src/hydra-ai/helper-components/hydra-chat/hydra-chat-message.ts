export default interface HydraChatMessage {
  sender: string;
  message: string;
  component?: React.ReactElement;
}
