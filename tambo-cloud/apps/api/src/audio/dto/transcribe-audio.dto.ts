import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class TranscribeAudioDto {
  @ApiProperty({
    description:
      "Audio file to transcribe (MP3, WAV, MP4, MPEG, MPGA, M4A, or WEBM)",
    type: "string",
    format: "binary",
  })
  @IsNotEmpty()
  file!: Express.Multer.File;
}
