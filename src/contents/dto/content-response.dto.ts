import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentType, ContentStatus } from "@enums/content.enum";
import { ChannelPlatform, ChannelStatus } from "@enums/channel.enum";
import { UserInterests } from "@enums/user.enum";
import { Content } from "@entities/content.entity";
import { WatchHistory } from "@entities/watch-history.entity";

export class ChannelDto {
  @ApiProperty({ example: "channel-uuid" })
  id: string;

  @ApiProperty({ example: "함뜨 공식채널" })
  name: string;

  @ApiPropertyOptional({ enum: ChannelPlatform, example: ChannelPlatform.YOUTUBE })
  platform?: ChannelPlatform;

  @ApiPropertyOptional({ example: "UC..." })
  sourceChannelId?: string;

  @ApiPropertyOptional({ enum: ChannelStatus, example: ChannelStatus.ACTIVE })
  status?: ChannelStatus;
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
  sourceVideoId: string;

  @ApiProperty({ example: "코바늘 기초 - 사슬뜨기" })
  name: string;

  @ApiProperty({ enum: ContentType })
  type: ContentType;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.ACTIVE })
  status: ContentStatus;

  @ApiProperty({ type: ChannelDto })
  channel: ChannelDto;

  @ApiPropertyOptional({ enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @ApiPropertyOptional({ example: "https://cdn.hamddu.online/symbols/chain.png", nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: true })
  pointApplyable: boolean;

  @ApiPropertyOptional({ example: 1, nullable: true })
  sortOrder: number | null;

  @ApiProperty({ example: "2026-04-01T10:00:00.000Z" })
  uploadedAt: Date | null;

  @ApiProperty({ example: "2026-04-02T12:00:00.000Z" })
  createdAt: Date;

  static from(content: Content): ContentListItemDto {
    return {
      id: content.id,
      sourceVideoId: content.sourceVideoId,
      name: content.name,
      type: content.type,
      status: content.status,
      channel: content.channel
        ? { id: content.channel.id, name: content.channel.name }
        : { id: '', name: '(삭제된 채널)' },
      interests: content.interests,
      imageUrl: content.media?.url ?? null,
      pointApplyable: content.pointApplyable,
      sortOrder: content.sortOrder,
      uploadedAt: content.uploadedAt,
      createdAt: content.createdAt,
    };
  }
}

export class ContentDetailDto extends ContentListItemDto {
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
      channel: content.channel
        ? {
            id: content.channel.id,
            name: content.channel.name,
            platform: content.channel.platform,
            sourceChannelId: content.channel.sourceChannelId,
            status: content.channel.status,
          }
        : { id: '', name: '(삭제된 채널)' },
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
