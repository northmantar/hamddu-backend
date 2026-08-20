import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController — refresh/logout 토큰 소스', () => {
  let controller: AuthController;
  let authService: { refreshTokens: jest.Mock; logout: jest.Mock };
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };

  const reqWith = (cookieToken?: string) =>
    ({ cookies: cookieToken ? { refresh_token: cookieToken } : {} }) as unknown as Request;

  beforeEach(() => {
    authService = {
      refreshTokens: jest
        .fn()
        .mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      logout: jest.fn(),
    };
    res = { cookie: jest.fn(), clearCookie: jest.fn() };

    // 컨트롤러에 걸린 가드까지 끌어오지 않도록 DI 없이 직접 생성한다.
    controller = new AuthController(
      authService as unknown as AuthService,
      { get: jest.fn() } as unknown as ConfigService,
    );
  });

  describe('refresh', () => {
    it('쿠키가 있으면 쿠키 토큰을 쓰고 body에는 refreshToken을 담지 않는다', async () => {
      const result = await controller.refresh(reqWith('cookie-token'), res as unknown as Response, {});

      expect(authService.refreshTokens).toHaveBeenCalledWith('cookie-token');
      expect(result).toEqual({ accessToken: 'new-access' });
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new-refresh', expect.any(Object));
    });

    it('쿠키가 없으면 body 토큰을 쓰고 회전된 토큰을 body로 돌려준다', async () => {
      const result = await controller.refresh(reqWith(), res as unknown as Response, {
        refreshToken: 'body-token',
      });

      expect(authService.refreshTokens).toHaveBeenCalledWith('body-token');
      expect(result).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });

    it('둘 다 없으면 401', async () => {
      await expect(
        controller.refresh(reqWith(), res as unknown as Response, {}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('쿠키가 없으면 body 토큰을 무효화한다', async () => {
      await controller.logout(reqWith(), res as unknown as Response, { refreshToken: 'body-token' });

      expect(authService.logout).toHaveBeenCalledWith('body-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
    });

    it('토큰이 아예 없으면 쿠키만 지운다', async () => {
      await controller.logout(reqWith(), res as unknown as Response, {});

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });
});
