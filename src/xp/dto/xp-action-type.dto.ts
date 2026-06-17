import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateXpActionTypeDto {
  @ApiProperty({ description: "액션 코드", example: "SIGNUP" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: "한글 라벨", example: "회원가입" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  labelKo: string;
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
