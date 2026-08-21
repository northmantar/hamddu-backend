import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Channel } from "@entities/channel.entity";
import { ChannelLink } from "@entities/channel-link.entity";
import { ChannelLinkType, ChannelPlatform, ChannelStatus } from "@enums/channel.enum";

const CDN_BASE = process.env.CDN_BASE_URL || "https://cdn.hamddu.online";

/** 링크 종류별 아이콘. website/etc는 공통 URL 로고를 쓴다. */
const LINK_ICON_URL: Record<ChannelLinkType, string> = {
  [ChannelLinkType.INSTAGRAM]: `${CDN_BASE}/icons/link-types/instagram.png`,
  [ChannelLinkType.SMARTSTORE]: `${CDN_BASE}/icons/link-types/smartstore.png`,
  [ChannelLinkType.YOUTUBE]: `${CDN_BASE}/icons/link-types/youtube.png`,
  [ChannelLinkType.WEBSITE]: `${CDN_BASE}/icons/link-types/url.png`,
  [ChannelLinkType.ETC]: `${CDN_BASE}/icons/link-types/url.png`,
};

export class ChannelLinkDto {
  @ApiProperty({ example: "link-uuid" })
  id: string;

  @ApiProperty({ enum: ChannelLinkType, example: ChannelLinkType.INSTAGRAM })
  type: ChannelLinkType;

  @ApiPropertyOptional({ example: null, nullable: true, description: "표시명 (etc일 때 사용)" })
  label: string | null;

  @ApiProperty({ example: "https://instagram.com/hamddu" })
  url: string;

  @ApiProperty({ example: 0, description: "노출 순서 (0부터 시작)" })
  sortOrder: number;

  @ApiProperty({
    example: "https://cdn.hamddu.online/icons/link-types/instagram.png",
    description: "링크 종류별 아이콘 URL (website/etc는 공통 URL 로고)",
  })
  iconUrl: string;

  static from(link: ChannelLink): ChannelLinkDto {
    return {
      id: link.id,
      type: link.type,
      label: link.label,
      url: link.url,
      sortOrder: link.sortOrder,
      iconUrl: LINK_ICON_URL[link.type],
    };
  }
}

export class ChannelResponseDto {
  @ApiProperty({ example: "channel-uuid" })
  id: string;

  @ApiProperty({ example: "함뜨 공식채널" })
  name: string;

  @ApiProperty({ enum: ChannelPlatform, example: ChannelPlatform.YOUTUBE })
  platform: ChannelPlatform;

  @ApiProperty({ example: "UC..." })
  sourceChannelId: string;

  @ApiProperty({ enum: ChannelStatus, example: ChannelStatus.ACTIVE })
  status: ChannelStatus;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  addedAt: Date;

  static from(channel: Channel): ChannelResponseDto {
    return {
      id: channel.id,
      name: channel.name,
      platform: channel.platform,
      sourceChannelId: channel.sourceChannelId,
      status: channel.status,
      addedAt: channel.addedAt,
    };
  }
}

/** 채널 홈 상세 (GET /channels/:id) */
export class ChannelDetailDto extends ChannelResponseDto {
  @ApiPropertyOptional({ example: "코바늘과 대바늘 기초를 알려드리는 채널입니다.", nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    example: "https://cdn.hamddu.online/media/profile.png",
    nullable: true,
    description: "프로필 이미지 URL",
  })
  profileImageUrl: string | null;

  @ApiPropertyOptional({ example: "media-uuid", nullable: true, description: "프로필 미디어 ID (어드민 수정용)" })
  profileMediaId: string | null;

  @ApiPropertyOptional({
    example: "https://cdn.hamddu.online/media/banner.png",
    nullable: true,
    description: "배너 이미지 URL",
  })
  bannerImageUrl: string | null;

  @ApiPropertyOptional({ example: "media-uuid", nullable: true, description: "배너 미디어 ID (어드민 수정용)" })
  bannerMediaId: string | null;

  @ApiProperty({ type: [ChannelLinkDto], description: "외부 링크 (sortOrder 오름차순)" })
  links: ChannelLinkDto[];

  static fromWithHome(channel: Channel): ChannelDetailDto {
    return {
      ...ChannelResponseDto.from(channel),
      description: channel.description,
      profileImageUrl: channel.profileMedia?.url ?? null,
      profileMediaId: channel.profileMediaId,
      bannerImageUrl: channel.bannerMedia?.url ?? null,
      bannerMediaId: channel.bannerMediaId,
      links: [...(channel.links ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(ChannelLinkDto.from),
    };
  }
}
