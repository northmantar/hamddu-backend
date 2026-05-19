import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: "채널명", example: "뜨개질 채널" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
