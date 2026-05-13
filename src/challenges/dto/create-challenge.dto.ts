import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateChallengeDto {
  @ApiProperty({ description: "인증할 콘텐츠 ID", example: "content-uuid" })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;

  @ApiPropertyOptional({ description: "챌린지 제목", example: "사슬뜨기 완성!" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: "챌린지 내용", example: "드디어 첫 작품을 완성했어요!" })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  body?: string;
}
