import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateChannelDto {
  @ApiProperty({ description: "채널명", example: "함뜨 공식채널" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: "유튜브 채널 ID", example: "UC..." })
  @IsString()
  @IsNotEmpty()
  youtubeChannelId: string;
}
