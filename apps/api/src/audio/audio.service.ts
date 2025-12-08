import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { OpenAI, toFile } from "openai";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly openaiClient: OpenAI;

  constructor(@Inject("OPENAI_API_KEY") private readonly openaiApiKey: string) {
    this.openaiClient = new OpenAI({
      apiKey: this.openaiApiKey,
    });
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new BadRequestException("Invalid audio data - buffer is empty");
    }
    try {
      this.logger.log(
        `Transcribing audio: bufferSize=${audioBuffer.length} bytes`,
      );

      const transcription = await this.transcribeWithOpenai(
        audioBuffer,
        filename,
      );

      if (!transcription || transcription.trim().length === 0) {
        throw new BadRequestException(
          "Empty transcription received - audio might be silent or invalid",
        );
      }

      return transcription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Audio transcription failed: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to transcribe audio: ${errorMessage}`,
      );
    }
  }

  private async transcribeWithOpenai(
    audioBuffer: Buffer,
    filename: string,
    model: string = "whisper-1",
  ): Promise<string> {
    const audioFile = await toFile(audioBuffer, filename);
    const transcription = await this.openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: model,
      response_format: "text",
    });

    return transcription;
  }
}
