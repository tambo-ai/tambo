import { Body, Controller, Inject, Post } from '@nestjs/common';
import * as aiServiceInterface from 'src/ai/interfaces/ai.service.interface';
import { ExtractComponentResponseDto } from 'src/extractor/dto/extract-component-response.dto';
import { ExtractComponentDto } from 'src/extractor/dto/extract-component.dto';

@Controller('extract')
export class ExtractorController {
  constructor(
    @Inject('AIService')
    private aiService: aiServiceInterface.AIServiceInterface,
  ) {}

  @Post()
  async extractComponent(
    @Body() extractComponentDto: ExtractComponentDto,
  ): Promise<ExtractComponentResponseDto[]> {
    return this.aiService.extractComponentDefinitions(
      extractComponentDto.content ?? '',
    );
  }
}
