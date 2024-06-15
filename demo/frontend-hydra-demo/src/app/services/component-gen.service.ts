import { DynamicMessage } from "../model/dynamic-message";
import { generateResponse } from "../../../actions/ai";

export const generateDynamicMessage = async (
  message: string
): Promise<DynamicMessage> => {
  const response = await generateResponse("graph", message);
  return { message: message, type: "graph", componentData: response };
};
