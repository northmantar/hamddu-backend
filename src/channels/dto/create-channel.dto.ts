import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ChannelPlatform } from "@enums/channel.enum";

export class CreateChannelDto {
  @ApiProperty({ description: "채널명", example: "함뜨 공식채널" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ChannelPlatform, description: "플랫폼", example: ChannelPlatform.YOUTUBE })
  @IsEnum(ChannelPlatform)
  platform: ChannelPlatform;

  @ApiProperty({ description: "플랫폼 채널 ID", example: "UC..." })
  @IsString()
  @IsNotEmpty()
  sourceChannelId: string;
}
