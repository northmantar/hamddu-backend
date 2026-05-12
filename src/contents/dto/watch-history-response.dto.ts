import { ApiProperty } from "@nestjs/swagger";
import { ContentType } from "@enums/content.enum";
import { WatchHistory } from "@entities/watch-history.entity";

export class WatchHistoryContentDto {
  @ApiProperty({ example: "content-uuid" })
  id: string;

  @ApiProperty({ example: "코바늘 기초 - 사슬뜨기" })
  name: string;

  @ApiProperty({ enum: ContentType })
  type: ContentType;
}

export class WatchHistoryListItemDto {
  @ApiProperty({ example: "history-uuid" })
  id: string;

  @ApiProperty({ type: WatchHistoryContentDto })
  content: WatchHistoryContentDto;

  @ApiProperty({ example: 600 })
  totalDuration: number;

  @ApiProperty({ example: "00:05:30" })
  lastWatchedTimestamp: string;

  @ApiProperty({ example: 55 })
  watchRate: number;

  @ApiProperty({ example: "2026-04-09T10:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T15:00:00.000Z" })
  lastWatchedAt: Date;

  static from(watchHistory: WatchHistory): WatchHistoryListItemDto {
    return {
      id: watchHistory.id,
      content: {
        id: watchHistory.content.id,
        name: watchHistory.content.name,
        type: watchHistory.content.type,
      },
      totalDuration: watchHistory.totalDuration,
      lastWatchedTimestamp: watchHistory.lastWatchedTimestamp,
      watchRate: watchHistory.watchRate,
      createdAt: watchHistory.createdAt,
      lastWatchedAt: watchHistory.lastWatchedAt,
    };
  }
}

export class WatchHistoryResponseDto {
  @ApiProperty({ example: "history-uuid" })
  id: string;

  @ApiProperty({ example: "content-uuid" })
  contentId: string;

  @ApiProperty({ example: 600 })
  totalDuration: number;

  @ApiProperty({ example: "00:05:30" })
  lastWatchedTimestamp: string;

  @ApiProperty({ example: 55 })
  watchRate: number;

  @ApiProperty({ example: "2026-04-09T10:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T15:00:00.000Z" })
  lastWatchedAt: Date;

  static from(watchHistory: WatchHistory): WatchHistoryResponseDto {
    return {
      id: watchHistory.id,
      contentId: watchHistory.contentId,
      totalDuration: watchHistory.totalDuration,
      lastWatchedTimestamp: watchHistory.lastWatchedTimestamp,
      watchRate: watchHistory.watchRate,
      createdAt: watchHistory.createdAt,
      lastWatchedAt: watchHistory.lastWatchedAt,
    };
  }
}
