import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";
import { ContentStatus } from "@enums/content.enum";

export class UpdateContentDto {
  @ApiPropertyOptional({ description: "콘텐츠 제목", minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: "플랫폼 비디오 ID" })
  @IsOptional()
  @IsString()
  sourceVideoId?: string;

  @ApiPropertyOptional({ description: "채널 ID" })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional({ description: "interests 내 정렬 순서 (1부터 시작)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: "포인트 지급 여부" })
  @IsOptional()
  @IsBoolean()
  pointApplyable?: boolean;

  @ApiPropertyOptional({
    description:
      "기본(눌리지 않은) 상태 아이콘 미디어 ID (POST /media/upload 응답의 id). null을 보내면 아이콘이 해제됩니다.",
    example: "media-uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  mediaId?: string | null;

  @ApiPropertyOptional({
    description: "눌린 상태 아이콘 미디어 ID (POST /media/upload 응답의 id). null을 보내면 아이콘이 해제됩니다.",
    example: "media-uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  activeMediaId?: string | null;

  @ApiPropertyOptional({ enum: ContentStatus, description: "콘텐츠 상태" })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
