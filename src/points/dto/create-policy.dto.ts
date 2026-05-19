import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PointActionType } from "@enums/point.enum";

export class CreatePointPolicyDto {
  @ApiProperty({
    description: "포인트 적립 액션 타입",
    enum: PointActionType,
    example: PointActionType.WATCH,
  })
  @IsEnum(PointActionType)
  actionType: PointActionType;

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
