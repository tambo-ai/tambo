import { Body, Controller, Inject, Post } from '@nestjs/common';
import * as aiServiceInterface from '../ai/interfaces/ai.service.interface';
import { ExtractComponentResponseDto } from './dto/extract-component-response.dto';
import { ExtractComponentDto } from './dto/extract-component.dto';

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
    return await this.aiService.extractComponentDefinitions(
      extractComponentDto.content ?? '',
    );
  }
}
