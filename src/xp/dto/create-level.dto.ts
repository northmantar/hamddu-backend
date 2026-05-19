import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateXpLevelDto {
  @ApiProperty({ description: "레벨", example: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ description: "XP 임계값 (해당 레벨 도달에 필요한 누적 XP)", example: 100 })
  @IsInt()
  @Min(0)
  xpThreshold: number;

  @ApiProperty({ description: "레벨 라벨", example: "초보 뜨개이" })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({ description: "활성화 여부", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
