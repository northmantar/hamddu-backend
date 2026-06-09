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
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Platform } from '@enums/user.enum';
import { OAuthProfile } from './interfaces/oauth-profile.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SetAdminPasswordDto } from './dto/set-admin-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { AdminGuard } from '../common/guards/admin.guard';

const COOKIE_NAME = 'refresh_token';

function cookieOptions(config: ConfigService) {
  return {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    path: '/',
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ── Google ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '구글 OAuth 로그인 시작' })
  @ApiResponse({ status: 302, description: '구글 로그인 페이지로 리다이렉트' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Passport redirects to Google — no body needed
  }

  @ApiOperation({ summary: '구글 OAuth 콜백 (구글이 직접 호출)' })
  @ApiResponse({ status: 302, description: '{FRONTEND_URL}/auth/success?access_token=...&survey_required=...' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.finishOAuthLogin(req.user as OAuthProfile, Platform.GOOGLE, res);
  }

  // ── Naver ────────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '네이버 OAuth 로그인 시작' })
  @ApiResponse({ status: 302, description: '네이버 로그인 페이지로 리다이렉트' })
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin(): void {}

  @ApiOperation({ summary: '네이버 OAuth 콜백 (네이버가 직접 호출)' })
  @ApiResponse({ status: 302, description: '{FRONTEND_URL}/auth/success?access_token=...&survey_required=...' })
  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.finishOAuthLogin(req.user as OAuthProfile, Platform.NAVER, res);
  }

  // ── Token management ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '액세스 토큰 재발급' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: '새 액세스 토큰 반환', schema: { example: { accessToken: 'eyJ...' } } })
  @ApiResponse({ status: 401, description: '쿠키 없음, 토큰 만료, 또는 재사용 시도' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const oldToken: string | undefined = req.cookies?.[COOKIE_NAME];
    if (!oldToken) throw new UnauthorizedException('No refresh token');

    const { accessToken, refreshToken } = await this.authService.refreshTokens(oldToken);
    res.cookie(COOKIE_NAME, refreshToken, cookieOptions(this.config));
    return { accessToken };
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 204, description: '로그아웃 성공, 쿠키 삭제' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token: string | undefined = req.cookies?.[COOKIE_NAME];
    if (token) await this.authService.logout(token);
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }

  // ── Admin authentication ─────────────────────────────────────────────────────

  @ApiOperation({ summary: '어드민 이메일/비밀번호 로그인' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        accessToken: 'eyJ...',
        user: { id: '...', email: 'admin@example.com', type: 'admin' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 오류' })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: { id: string; email: string; type: string } }> {
    const { user, tokens } = await this.authService.adminLogin(dto.email, dto.password);
    res.cookie(COOKIE_NAME, tokens.refreshToken, cookieOptions(this.config));
    return {
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email ?? '', type: user.type },
    };
  }

  @ApiOperation({ summary: '어드민 비밀번호 설정 (최초 1회)' })
  @ApiBearerAuth()
  @ApiBody({ type: SetAdminPasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 설정 완료' })
  @ApiResponse({ status: 400, description: '이미 비밀번호가 설정됨' })
  @ApiResponse({ status: 403, description: '어드민 권한 없음' })
  @Post('admin/set-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async setAdminPassword(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: SetAdminPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.setAdminPassword(payload.sub, dto.password);
    return { message: '비밀번호가 설정되었습니다.' };
  }

  @ApiOperation({ summary: '어드민 비밀번호 변경' })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 완료' })
  @ApiResponse({ status: 400, description: '비밀번호 미설정' })
  @ApiResponse({ status: 401, description: '현재 비밀번호 오류' })
  @ApiResponse({ status: 403, description: '어드민 권한 없음' })
  @Patch('admin/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changeAdminPassword(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changeAdminPassword(payload.sub, dto.currentPassword, dto.newPassword);
    return { message: '비밀번호가 변경되었습니다.' };
  }

  @ApiOperation({ summary: '어드민 비밀번호 초기화 (관리자)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '비밀번호를 초기화할 어드민 유저 ID' })
  @ApiBody({ type: ResetAdminPasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 초기화 완료' })
  @ApiResponse({ status: 400, description: '본인 계정은 이 API 사용 불가' })
  @ApiResponse({ status: 403, description: '어드민 권한 없음' })
  @ApiResponse({ status: 404, description: '어드민 유저를 찾을 수 없음' })
  @Post('admin/users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resetAdminPassword(
    @Param('id', ParseUUIDPipe) targetId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: ResetAdminPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetAdminPassword(payload.sub, targetId, dto.newPassword);
    return { message: '비밀번호가 초기화되었습니다.' };
  }

  @ApiOperation({ summary: '어드민 유저 삭제 (관리자)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '삭제할 어드민 유저 ID' })
  @ApiResponse({ status: 204, description: '어드민 삭제 완료' })
  @ApiResponse({ status: 400, description: '본인 계정은 삭제 불가' })
  @ApiResponse({ status: 403, description: '어드민 권한 없음' })
  @ApiResponse({ status: 404, description: '어드민 유저를 찾을 수 없음' })
  @Delete('admin/users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteAdminUser(
    @Param('id', ParseUUIDPipe) targetId: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<void> {
    await this.authService.deleteAdminUser(payload.sub, targetId);
  }

  // ── Shared helper ────────────────────────────────────────────────────────────

  private async finishOAuthLogin(
    profile: OAuthProfile,
    platform: Platform,
    res: Response,
  ): Promise<void> {
    const user = await this.authService.handleOAuthLogin(platform, profile);
    const { accessToken, refreshToken } = await this.authService.issueTokens(user.id);

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions(this.config));

    const surveyRequired = !user.surveyCompletedAt;
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    // Pass the short-lived access token via query param; frontend stores it in memory.
    res.redirect(
      `${frontendUrl}/auth/success?access_token=${accessToken}&survey_required=${surveyRequired}`,
    );
  }
}
