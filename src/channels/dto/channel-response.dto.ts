import { ApiProperty } from "@nestjs/swagger";
import { Channel } from "@entities/channel.entity";
import { ChannelPlatform, ChannelStatus } from "@enums/channel.enum";

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
