import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import mimeTypes from "mime-types";
import { ApiKeyGuard } from "src/projects/guards/apikey.guard";
import { AudioService } from "./audio.service";
import { TranscribeAudioDto } from "./dto/transcribe-audio.dto";

@ApiTags("audio")
@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  // Maximum file size in MB
  private readonly MAX_FILE_SIZE_MB = 25;

  @Post("transcribe")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Audio file to transcribe",
    type: TranscribeAudioDto,
  })
  @ApiOperation({
    summary: "Transcribe audio to text",
    description: `Upload an audio file and get its transcription. Supports MP3, WAV, MP4, MPEG, MPGA, M4A, and WEBM formats. Maximum file size is 25 MB.`,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid audio file or format",
  })
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    this.validateAudioFile(file);
    return await this.audioService.transcribeAudio(
      file.buffer,
      file.originalname,
    );
  }

  private validateAudioFile(
    file: Express.Multer.File,
    maxFileSizeBytes: number = this.MAX_FILE_SIZE_MB * 1024 * 1024,
  ): void {
    if (file.size > maxFileSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size allowed is ${maxFileSizeBytes / (1024 * 1024)}MB`,
      );
    }

    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/webm",
      "video/mp4",
    ];

    const mimeType =
      file.mimetype || mimeTypes.contentType(file.originalname) || "unknown";

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Supported types: ${allowedMimeTypes.join(", ")}`,
      );
    }
  }
}
