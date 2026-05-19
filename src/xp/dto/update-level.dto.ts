import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateXpLevelDto {
  @ApiPropertyOptional({ description: "XP 임계값", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpThreshold?: number;

  @ApiPropertyOptional({ description: "레벨 라벨", example: "초보 뜨개이" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ description: "활성화 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
