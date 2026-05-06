import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNicknameDto {
  @ApiProperty({ description: '변경할 닉네임', example: '실뭉치장인' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[가-힣a-zA-Z0-9_]+$/, {
    message: 'Nickname may only contain Korean characters, letters, numbers, and underscores',
  })
  nickname: string;
}
