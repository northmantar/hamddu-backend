import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../boards/dto/pagination.dto";
import { ContentType } from "@enums/content.enum";

export class ContentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ContentType, description: "콘텐츠 유형 필터" })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional({ description: "채널 ID 필터" })
  @IsOptional()
  @IsUUID()
  channelId?: string;
}
