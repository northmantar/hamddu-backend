import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
import { ChannelLinkType } from "@enums/channel.enum";

export class ChannelLinkInputDto {
  @ApiProperty({ enum: ChannelLinkType, description: "링크 종류" })
  @IsEnum(ChannelLinkType)
  type: ChannelLinkType;

  @ApiProperty({ description: "링크 URL", example: "https://instagram.com/hamddu" })
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2048)
  url: string;

  @ApiPropertyOptional({
    description: "표시명. type이 etc이면 필수, 그 외 종류에서는 생략 시 앱 기본 표기를 사용",
    example: "블로그",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string | null;
}
