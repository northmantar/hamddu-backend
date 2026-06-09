import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SurveyDto } from './dto/survey.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PaginationMeta } from '../boards/dto/pagination.dto';
import { UserType } from '../enums/user.enum';
import * as bcrypt from 'bcrypt';

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

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '유저 목록 조회 (관리자)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'type', required: false, enum: UserType, description: 'admin | member' })
  @ApiResponse({ status: 200, description: '유저 목록 반환 (type=member이면 xp·points 포함)' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @Get()
  @UseGuards(AdminGuard)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: UserType,
  ): Promise<{ data: UserResponseDto[]; meta: PaginationMeta }> {
    if (type === UserType.MEMBER) {
      const { data, totalCount } = await this.usersService.findMembersWithWallets(+page, +limit);
      return {
        data: data.map((u) => ({ ...UserResponseDto.from(u), xp: u.xp, points: u.points })),
        meta: { page: +page, limit: +limit, totalCount, totalPages: Math.ceil(totalCount / +limit) },
      };
    }

    const { data, totalCount } = await this.usersService.findAllUsers(+page, +limit, type);
    return {
      data: data.map(UserResponseDto.from),
      meta: { page: +page, limit: +limit, totalCount, totalPages: Math.ceil(totalCount / +limit) },
    };
  }

  @ApiOperation({ summary: '유저 생성 (관리자)' })
  @ApiResponse({ status: 201, description: '유저 생성 완료', type: UserResponseDto })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  @Post()
  @UseGuards(AdminGuard)
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser(dto.email, hashed, dto.type ?? UserType.MEMBER);
    return UserResponseDto.from(user);
  }

  @ApiOperation({ summary: '유저 상태 변경 (관리자)' })
  @ApiParam({ name: 'id', description: '유저 ID' })
  @ApiResponse({ status: 204, description: '상태 변경 완료' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<void> {
    await this.usersService.updateUserStatus(id, dto.status);
  }

  @ApiOperation({ summary: '유저 역할 변경 (관리자)' })
  @ApiParam({ name: 'id', description: '유저 ID' })
  @ApiResponse({ status: 200, description: '역할 변경 완료', type: UserResponseDto })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  @Patch(':id/role')
  @UseGuards(AdminGuard)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateUserType(id, dto.type);
    return UserResponseDto.from(user);
  }
}
