import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ChannelStatus } from "@enums/channel.enum";

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: "채널명", example: "뜨개질 채널" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ChannelStatus, description: "채널 상태" })
  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;
}
