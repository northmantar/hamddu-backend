import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ChannelStatus } from "@enums/channel.enum";
import { ChannelLinkInputDto } from "./channel-link.dto";

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

  @ApiPropertyOptional({
    description: "채널 홈 소개글. null을 보내면 소개글이 삭제됩니다.",
    example: "코바늘과 대바늘 기초를 알려드리는 채널입니다.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    description: "프로필 이미지 미디어 ID (POST /media/upload 응답의 id). null을 보내면 해제됩니다.",
    example: "media-uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  profileMediaId?: string | null;

  @ApiPropertyOptional({
    description: "배너 이미지 미디어 ID (POST /media/upload 응답의 id). null을 보내면 해제됩니다.",
    example: "media-uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  bannerMediaId?: string | null;

  @ApiPropertyOptional({
    description:
      "채널 홈 외부 링크 목록. 보낸 배열로 **전량 교체**되며, 배열 순서가 노출 순서가 됩니다. 빈 배열을 보내면 전부 삭제됩니다.",
    type: [ChannelLinkInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChannelLinkInputDto)
  links?: ChannelLinkInputDto[];
}
