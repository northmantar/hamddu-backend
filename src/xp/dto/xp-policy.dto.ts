import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateXpPolicyDto {
  @ApiProperty({
    description: "XP 적립 액션 타입 코드 (xp_action_types.code 참조)",
    example: "SIGNUP",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  actionType: string;

  @ApiProperty({ description: "지급 XP", example: 50 })
  @IsInt()
  @Min(1)
  xpAmount: number;

  @ApiPropertyOptional({ description: "1회성 적립 여부", default: false })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({ description: "활성화 여부", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateXpPolicyDto {
  @ApiPropertyOptional({ description: "지급 XP" })
  @IsOptional()
  @IsInt()
  @Min(1)
  xpAmount?: number;

  @ApiPropertyOptional({ description: "1회성 적립 여부" })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional({ description: "활성화 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
