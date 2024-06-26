export interface DynamicMessage {
  who: string;
  message?: string;
  type: "text" | "component";
  component?: React.ReactElement;
}
