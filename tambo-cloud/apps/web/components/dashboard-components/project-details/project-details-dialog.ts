/**
 * Type definition for alert dialogs used across project details components
 */
export type AlertState = {
  show: boolean;
  title: string;
  description: string;
  data?: { id: string; [key: string]: any };
};
