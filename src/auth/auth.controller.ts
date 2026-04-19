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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ── Google ──────────────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.finishOAuthLogin(req.user as OAuthProfile, Platform.GOOGLE, res);
  }

  // ── Naver ────────────────────────────────────────────────────────────────────

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverLogin(): void {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.finishOAuthLogin(req.user as OAuthProfile, Platform.NAVER, res);
  }

  // ── Token management ─────────────────────────────────────────────────────────

  /**
   * POST /auth/refresh
   * Reads the httpOnly cookie, rotates the refresh token, and returns a new access token.
   */
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

  /**
   * POST /auth/logout
   * Revokes the refresh token and clears the cookie. No auth required
   * (the refresh token itself is the credential).
   */
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
