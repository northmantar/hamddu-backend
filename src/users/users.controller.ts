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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { SurveyDto } from './dto/survey.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersService.findById(payload.sub);
    return UserResponseDto.from(user);
  }

  @Patch('me')
  async updateNickname(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateNicknameDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateNickname(payload.sub, dto);
    return UserResponseDto.from(user);
  }

  @Post('me/survey')
  async completeSurvey(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: SurveyDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.completeSurvey(payload.sub, dto);
    return UserResponseDto.from(user);
  }

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
