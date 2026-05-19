import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { Platform, UserType } from '@enums/user.enum';
import { OAuthProfile } from './interfaces/oauth-profile.interface';
import { User } from '@entities/user.entity';
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

  async adminLogin(email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.usersService.findAdminByEmail(email);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!user.password) {
      throw new BadRequestException('비밀번호가 설정되지 않았습니다. OAuth 로그인 후 비밀번호를 설정해주세요.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = await this.issueTokens(user.id);
    return { user, tokens };
  }

  async setAdminPassword(userId: string, password: string): Promise<void> {
    const user = await this.usersService.findByIdOrFail(userId);

    if (user.type !== UserType.ADMIN) {
      throw new ForbiddenException('어드민만 비밀번호를 설정할 수 있습니다.');
    }

    if (user.password) {
      throw new BadRequestException('비밀번호가 이미 설정되어 있습니다. 비밀번호 변경 API를 사용하세요.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.setPassword(userId, hashedPassword);
  }

  async changeAdminPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByIdOrFail(userId);

    if (user.type !== UserType.ADMIN) {
      throw new ForbiddenException('어드민만 비밀번호를 변경할 수 있습니다.');
    }

    if (!user.password) {
      throw new BadRequestException('비밀번호가 설정되지 않았습니다. 먼저 비밀번호를 설정해주세요.');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.setPassword(userId, hashedPassword);
  }
}
