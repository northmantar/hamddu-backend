import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Platform } from '@enums/user.enum';
import { OAuthProfile } from './interfaces/oauth-profile.interface';

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
