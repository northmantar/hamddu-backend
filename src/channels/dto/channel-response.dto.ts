import { ApiProperty } from "@nestjs/swagger";
import { Channel } from "@entities/channel.entity";

export class ChannelResponseDto {
  @ApiProperty({ example: "channel-uuid" })
  id: string;

  @ApiProperty({ example: "함뜨 공식채널" })
  name: string;

  @ApiProperty({ example: "UC..." })
  youtubeChannelId: string;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  addedAt: Date;

  static from(channel: Channel): ChannelResponseDto {
    return {
      id: channel.id,
      name: channel.name,
      youtubeChannelId: channel.youtubeChannelId,
      addedAt: channel.addedAt,
    };
  }
}
