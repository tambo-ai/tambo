import { z } from "zod";

export class ResponseParserService {
  async parseAndValidate<T extends z.ZodTypeAny>(
    schema: T,
    text: string | object,
  ): Promise<z.infer<T>> {
    try {
      let json;
      if (typeof text === "string") {
        json = text.trim();
        json = JSON.parse(json);
      } else {
        json = text;
      }
      return await schema.parseAsync(json);
    } catch (e) {
      console.error(
        `Failed to parse. Text: "${typeof text === "string" ? text : JSON.stringify(text)}". Error: ${e}`,
      );
      throw new Error(
        `Failed to parse. Text: "${typeof text === "string" ? text : JSON.stringify(text)}". Error: ${e}`,
      );
    }
  }
}
