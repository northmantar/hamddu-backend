import { IsString, Length, Matches } from 'class-validator';

export class UpdateNicknameDto {
  @IsString()
  @Length(2, 30)
  @Matches(/^[가-힣a-zA-Z0-9_]+$/, {
    message: 'Nickname may only contain Korean characters, letters, numbers, and underscores',
  })
  nickname: string;
}
