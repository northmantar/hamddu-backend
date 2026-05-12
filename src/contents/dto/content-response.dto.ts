import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentType } from "@enums/content.enum";
import { UserInterests } from "@enums/user.enum";
import { Content } from "@entities/content.entity";
import { WatchHistory } from "@entities/watch-history.entity";

export class ChannelDto {
  @ApiProperty({ example: "channel-uuid" })
  id: string;

  @ApiProperty({ example: "함뜨 공식채널" })
  name: string;

  @ApiPropertyOptional({ example: "UC..." })
  youtubeChannelId?: string;
}

export class WatchHistoryDto {
  @ApiProperty({ example: 55 })
  watchRate: number;

  @ApiProperty({ example: "00:05:30" })
  lastWatchedTimestamp: string;

  @ApiProperty({ example: "2026-04-09T15:00:00.000Z" })
  lastWatchedAt: Date;
}

export class ContentListItemDto {
  @ApiProperty({ example: "content-uuid" })
  id: string;

  @ApiProperty({ example: "dQw4w9WgXcQ" })
  youtubeVideoId: string;

  @ApiProperty({ example: "코바늘 기초 - 사슬뜨기" })
  name: string;

  @ApiProperty({ enum: ContentType })
  type: ContentType;

  @ApiProperty({ type: ChannelDto })
  channel: ChannelDto;

  @ApiProperty({ example: true })
  pointApplyable: boolean;

  @ApiPropertyOptional({ example: null, nullable: true })
  previousContentId: string | null;

  @ApiPropertyOptional({ example: "next-content-uuid", nullable: true })
  nextContentId: string | null;

  @ApiProperty({ example: "2026-04-01T10:00:00.000Z" })
  uploadedAt: Date | null;

  @ApiProperty({ example: "2026-04-02T12:00:00.000Z" })
  createdAt: Date;

  static from(content: Content): ContentListItemDto {
    return {
      id: content.id,
      youtubeVideoId: content.youtubeVideoId,
      name: content.name,
      type: content.type,
      channel: {
        id: content.channel.id,
        name: content.channel.name,
      },
      pointApplyable: content.pointApplyable,
      previousContentId: content.previousContentId,
      nextContentId: content.nextContentId,
      uploadedAt: content.uploadedAt,
      createdAt: content.createdAt,
    };
  }
}

export class ContentDetailDto extends ContentListItemDto {
  @ApiPropertyOptional({ enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @ApiPropertyOptional({ type: WatchHistoryDto, nullable: true })
  watchHistory?: WatchHistoryDto | null;

  @ApiPropertyOptional({ example: false })
  challengeCompleted?: boolean;

  static fromWithDetails(
    content: Content,
    watchHistory: WatchHistory | null,
    challengeCompleted: boolean,
  ): ContentDetailDto {
    const base = ContentListItemDto.from(content);

    const dto: ContentDetailDto = {
      ...base,
      interests: content.interests,
      channel: {
        id: content.channel.id,
        name: content.channel.name,
        youtubeChannelId: content.channel.youtubeChannelId,
      },
    };

    // 튜토리얼 콘텐츠(symbol)인 경우에만 시청 기록과 챌린지 완료 여부 포함
    if (content.type === ContentType.SYMBOL) {
      dto.watchHistory = watchHistory
        ? {
            watchRate: watchHistory.watchRate,
            lastWatchedTimestamp: watchHistory.lastWatchedTimestamp,
            lastWatchedAt: watchHistory.lastWatchedAt,
          }
        : null;
      dto.challengeCompleted = challengeCompleted;
    }

    return dto;
  }
}
