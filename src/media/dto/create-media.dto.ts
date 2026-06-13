import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateMediaDto {
  @ApiProperty({
    example: "https://cdn.hamddu.online/media/abc123.jpg",
    description: "프론트에서 R2에 업로드한 후 받은 CDN URL",
  })
  @IsNotEmpty({ message: "URL은 필수입니다." })
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  url: string;

  @ApiPropertyOptional({
    example: "image/jpeg",
    description: "MIME 타입",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}
