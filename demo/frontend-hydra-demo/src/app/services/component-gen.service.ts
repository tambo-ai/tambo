import { generateResponse } from "../../../actions/ai";
import { DynamicMessage } from "../model/dynamic-message";

export const generateDynamicMessage = async (
  message: string
): Promise<DynamicMessage> => {
  const response = await generateResponse("graph", message);
  console.log("Response:", response);
  return {
    message: message,
    type: "graph",
    componentData: response,
  };
};
