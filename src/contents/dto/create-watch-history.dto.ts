import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateWatchHistoryDto {
  @ApiProperty({ description: "콘텐츠 ID" })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({ description: "전체 영상 길이 (초)", example: 600 })
  @IsInt()
  @Min(0)
  totalDuration: number;

  @ApiProperty({ description: "마지막 시청 위치 (HH:mm:ss)", example: "00:05:30" })
  @IsString()
  @Matches(/^([0-1]?\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: "lastWatchedTimestamp는 HH:mm:ss 형식이어야 합니다.",
  })
  lastWatchedTimestamp: string;

  @ApiProperty({ description: "시청 비율 (0-100)", example: 55 })
  @IsInt()
  @Min(0)
  @Max(100)
  watchRate: number;
}
