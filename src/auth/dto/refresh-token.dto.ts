import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      '리프레시 토큰. 쿠키를 쓸 수 없는 모바일 클라이언트만 사용하며, 쿠키가 있으면 쿠키가 우선한다.',
    example: 'a1b2c3...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
