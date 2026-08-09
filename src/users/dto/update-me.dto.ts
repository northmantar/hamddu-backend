import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ description: '변경할 닉네임', example: '실뭉치장인' })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  @Matches(/^[가-힣a-zA-Z0-9_ ]+$/, {
    message: 'Nickname may only contain Korean characters, letters, numbers, spaces, and legacy underscores',
  })
  nickname?: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 미디어 ID (POST /media 응답의 id). null을 보내면 해제됩니다.',
    example: 'media-uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  profileMediaId?: string | null;
}
