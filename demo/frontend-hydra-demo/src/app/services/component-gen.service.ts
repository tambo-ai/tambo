import { generateResponse } from "../../../actions/ai";
import { DynamicMessage } from "../model/dynamic-message";

export const generateDynamicMessage = async (
  message: string
): Promise<DynamicMessage> => {
  const response = await generateResponse("profile_photos_row", message);
  console.log("Response:", response);
  return {
    message: message,
    type: "profile_photos_row",
    componentData: response,
  };
};
