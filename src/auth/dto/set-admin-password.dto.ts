import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, Matches } from "class-validator";

export class SetAdminPasswordDto {
  @ApiProperty({
    description: "설정할 비밀번호 (최소 8자, 영문+숫자 필수)",
    example: "password123!",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "비밀번호는 영문과 숫자를 모두 포함해야 합니다.",
  })
  password: string;
}
