import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ description: "어드민 이메일", example: "admin@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "비밀번호 (최소 8자)", example: "password123!" })
  @IsString()
  @MinLength(8)
  password: string;
}
