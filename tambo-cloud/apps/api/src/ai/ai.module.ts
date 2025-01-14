import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIService } from './services/openai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'AIService',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('EXTRACTION_OPENAI_API_KEY');
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY is not set');
        }
        return new OpenAIService(apiKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['AIService'],
})
export class AIModule {}
