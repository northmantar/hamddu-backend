import { IsString, Length, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// TODO: 닉네임 길이제한 어떻게 할지 생각
export class RegisterNicknameDto {
  @IsString()
  @ApiProperty({
    description: "The nickname to register",
  })
  @Length(2, 30)
  @Matches(/^[가-힣a-zA-Z0-9_ ]+$/, {
    message:
      "Nickname may only contain Korean characters, letters, numbers, spaces, and legacy underscores",
  })
  nickname: string;
}
