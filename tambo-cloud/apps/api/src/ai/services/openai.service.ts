import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ExtractComponentResponseDto } from 'src/extractor/dto/extract-component-response.dto';
import { AIServiceInterface } from '../interfaces/ai.service.interface';

@Injectable()
export class OpenAIService implements AIServiceInterface {
  private readonly openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async extractComponentDefinitions(
    fileContents: string,
  ): Promise<ExtractComponentResponseDto[]> {
    const systemPrompt = `
        You are a bot that extracts react components, inferring their usage from the codebase.

        I will give you a typescript file and you will return a of JSON object with a single entry, 'entries', which is an array of objects.
        each object contains the following properties:

        - name: the name of the component
        - description: a description of the component
        - propsDefinition: an object containing the name of each prop and its type 
		- isDefaultExport: a boolean indicating whether the component is the default export of the file

		ONLY return components that have been exported from the file.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: fileContents,
        },
      ],
      response_format: {
        type: 'json_object',
      },
    });

    const components = JSON.parse(
      response.choices[0].message.content ?? '[]',
    ) as { entries: ExtractComponentResponseDto[] };
    return components.entries;
  }
}
