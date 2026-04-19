import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { Platform } from '@enums/user.enum';
import { OAuthProfile } from './interfaces/oauth-profile.interface';
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async handleOAuthLogin(platform: Platform, profile: OAuthProfile) {
    return this.usersService.findOrCreate(platform, profile.providerUserId, profile.email);
  }

  async issueTokens(userId: string): Promise<TokenPair> {
    const accessToken = this.jwtService.sign({ sub: userId });

    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hash(refreshToken);

    // Store hash → userId with TTL
    await this.redis.set(`rt:${tokenHash}`, userId, REFRESH_TOKEN_TTL_SECONDS);
    // Track all hashes per user for bulk revocation on withdrawal
    await this.redis.sadd(`user_rts:${userId}`, tokenHash);

    return { accessToken, refreshToken };
  }

  /**
   * Validates the old refresh token, deletes it, and issues a new pair.
   * Any reuse of an already-rotated token returns 401.
   */
  async refreshTokens(oldRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hash(oldRefreshToken);
    const userId = await this.redis.get(`rt:${tokenHash}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate — delete old before issuing new
    await this.redis.del(`rt:${tokenHash}`);
    await this.redis.srem(`user_rts:${userId}`, tokenHash);

    return this.issueTokens(userId);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    const userId = await this.redis.get(`rt:${tokenHash}`);
    if (!userId) return; // already expired or invalid — idempotent

    await this.redis.del(`rt:${tokenHash}`);
    await this.redis.srem(`user_rts:${userId}`, tokenHash);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
