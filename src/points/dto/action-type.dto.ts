import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { RewardAction } from "../../rewards/constants/reward-events";

export class CreatePointActionTypeDto {
  @ApiProperty({ description: "액션 코드 (대문자 권장)", example: "BOARD_CREATE" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: "한글 라벨", example: "게시글 작성" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  labelKo: string;

  @ApiProperty({ description: "참조 테이블명 (보상 이벤트 레지스트리에 등록된 값)", example: "board" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  refType: string;

  @ApiProperty({ description: "CRUD 액션", enum: RewardAction, example: RewardAction.CREATE })
  @IsEnum(RewardAction)
  refAction: RewardAction;
}

export class UpdatePointActionTypeDto {
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
