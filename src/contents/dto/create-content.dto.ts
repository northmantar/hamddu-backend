import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ContentType } from "@enums/content.enum";
import { UserInterests } from "@enums/user.enum";

export class CreateContentDto {
  @ApiProperty({ description: "채널 ID" })
  @IsUUID()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({ description: "유튜브 비디오 ID" })
  @IsString()
  @IsNotEmpty()
  youtubeVideoId: string;

  @ApiProperty({ description: "콘텐츠 제목", minLength: 1, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: ContentType, description: "콘텐츠 유형" })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiPropertyOptional({ enum: UserInterests, description: "콘텐츠 분류" })
  @IsOptional()
  @IsEnum(UserInterests)
  interests?: UserInterests;

  @ApiPropertyOptional({ description: "interests 내 정렬 순서 (1부터 시작)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: "포인트 지급 여부", default: false })
  @IsOptional()
  @IsBoolean()
  pointApplyable?: boolean;
}
