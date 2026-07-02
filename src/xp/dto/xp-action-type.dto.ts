import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { RewardAction } from "../../rewards/constants/reward-events";

export class CreateXpActionTypeDto {
  @ApiProperty({ description: "액션 코드", example: "USER_SIGNUP" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: "한글 라벨", example: "회원가입" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  labelKo: string;

  @ApiProperty({ description: "참조 테이블명 (보상 이벤트 레지스트리에 등록된 값)", example: "users" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  refType: string;

  @ApiProperty({ description: "CRUD 액션", enum: RewardAction, example: RewardAction.CREATE })
  @IsEnum(RewardAction)
  refAction: RewardAction;
}

export class UpdateXpActionTypeDto {
  @ApiPropertyOptional({ description: "한글 라벨" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  labelKo?: string;

  @ApiPropertyOptional({ description: "활성화 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
