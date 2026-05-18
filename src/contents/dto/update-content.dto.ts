import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdateContentDto {
  @ApiPropertyOptional({ description: "콘텐츠 제목", minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: "interests 내 정렬 순서 (1부터 시작)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: "포인트 지급 여부" })
  @IsOptional()
  @IsBoolean()
  pointApplyable?: boolean;
}
