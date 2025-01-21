import { ExtractComponentResponseDto } from '../../extractor/dto/extract-component-response.dto';

export interface AIServiceInterface {
  extractComponentDefinitions(
    content: string,
  ): Promise<ExtractComponentResponseDto[]>;
}
