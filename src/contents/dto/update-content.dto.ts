import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class UpdateContentDto {
  @ApiPropertyOptional({ description: "콘텐츠 제목", minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: "이전 단계 콘텐츠 ID" })
  @IsOptional()
  @IsUUID()
  previousContentId?: string;

  @ApiPropertyOptional({ description: "포인트 지급 여부" })
  @IsOptional()
  @IsBoolean()
  pointApplyable?: boolean;
}
