import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { SurveyDto } from './dto/survey.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '유저 객체 반환', type: UserResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Get('me')
  async getMe(@CurrentUser() payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrFail(payload.sub);
    return UserResponseDto.from(user);
  }

  @ApiOperation({ summary: '닉네임 변경' })
  @ApiResponse({ status: 200, description: '변경된 유저 객체 반환', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 409, description: '닉네임 중복' })
  @Patch('me')
  async updateNickname(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateNicknameDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateNickname(payload.sub, dto);
    return UserResponseDto.from(user);
  }

  @ApiOperation({ summary: '설문 제출' })
  @ApiResponse({ status: 200, description: '설문 완료된 유저 객체 반환', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '유효하지 않은 enum 값' })
  @Post('me/survey')
  async completeSurvey(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: SurveyDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.completeSurvey(payload.sub, dto);
    return UserResponseDto.from(user);
  }

  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 204, description: '탈퇴 성공' })
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async withdraw(
    @CurrentUser() payload: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.usersService.withdraw(payload.sub);
    res.clearCookie('refresh_token', { path: '/' });
  }
}
