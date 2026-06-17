import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreatePointPolicyDto {
  @ApiProperty({
    description: "포인트 적립 액션 타입 코드 (point_action_types.code 참조)",
    example: "WATCH",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  actionType: string;

  @ApiProperty({ description: "적립 포인트", example: 100 })
  @IsInt()
  @Min(1)
  pointAmount: number;

  @ApiPropertyOptional({ description: "1회성 적립 여부", default: false })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({ description: "활성화 여부", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
