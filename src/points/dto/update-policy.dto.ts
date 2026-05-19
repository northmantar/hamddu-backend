import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdatePointPolicyDto {
  @ApiPropertyOptional({ description: "적립 포인트", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointAmount?: number;

  @ApiPropertyOptional({ description: "1회성 적립 여부" })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({ description: "활성화 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
