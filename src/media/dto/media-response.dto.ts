import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Media } from "@entities/media.entity";

export class MediaResponseDto {
  @ApiProperty({ example: "media-uuid" })
  id: string;

  @ApiProperty({ example: "https://cdn.hamddu.online/media/abc123.jpg" })
  url: string;

  @ApiPropertyOptional({ example: "image/jpeg", nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;

  static from(media: Media): MediaResponseDto {
    return {
      id: media.id,
      url: media.url,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }
}
