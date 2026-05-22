import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { Platform, UserType } from '@enums/user.enum';
import { User } from '@entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'admin@example.com',
    platform: Platform.GOOGLE,
    platformUserId: 'google-123',
    type: UserType.ADMIN,
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    const mockUsersService = {
      findOrCreate: jest.fn(),
      findByIdOrFail: jest.fn(),
      findAdminByEmail: jest.fn(),
      setPassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockRedisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOAuthLogin', () => {
    it('should call findOrCreate with correct params', async () => {
      usersService.findOrCreate.mockResolvedValue(mockUser as User);

      const profile = { providerUserId: 'google-123', email: 'test@example.com' };
      await service.handleOAuthLogin(Platform.GOOGLE, profile);

      expect(usersService.findOrCreate).toHaveBeenCalledWith(
        Platform.GOOGLE,
        'google-123',
        'test@example.com',
      );
    });
  });

  describe('issueTokens', () => {
    it('should return access and refresh tokens', async () => {
      jwtService.sign.mockReturnValue('access-token');

      const result = await service.issueTokens('user-123');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(redisService.set).toHaveBeenCalled();
      expect(redisService.sadd).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should rotate tokens successfully', async () => {
      redisService.get.mockResolvedValue('user-123');
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshTokens('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(redisService.del).toHaveBeenCalled();
      expect(redisService.srem).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete token from redis', async () => {
      redisService.get.mockResolvedValue('user-123');

      await service.logout('refresh-token');

      expect(redisService.del).toHaveBeenCalled();
      expect(redisService.srem).toHaveBeenCalled();
    });

    it('should not throw for already expired token', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.logout('expired-token')).resolves.not.toThrow();
    });
  });

  describe('adminLogin', () => {
    it('should login admin successfully', async () => {
      usersService.findAdminByEmail.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('access-token');

      const result = await service.adminLogin('admin@example.com', 'password');

      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findAdminByEmail.mockResolvedValue(null);

      await expect(service.adminLogin('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if password not set', async () => {
      usersService.findAdminByEmail.mockResolvedValue({ ...mockUser, password: null } as User);

      await expect(service.adminLogin('admin@example.com', 'password')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findAdminByEmail.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.adminLogin('admin@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('setAdminPassword', () => {
    it('should set password for admin without password', async () => {
      usersService.findByIdOrFail.mockResolvedValue({ ...mockUser, password: null } as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.setAdminPassword('user-123', 'newPassword');

      expect(usersService.setPassword).toHaveBeenCalledWith('user-123', 'hashedPassword');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      usersService.findByIdOrFail.mockResolvedValue({
        ...mockUser,
        type: UserType.MEMBER,
        password: null,
      } as User);

      await expect(service.setAdminPassword('user-123', 'password')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if password already set', async () => {
      usersService.findByIdOrFail.mockResolvedValue(mockUser as User);

      await expect(service.setAdminPassword('user-123', 'password')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changeAdminPassword', () => {
    it('should change password successfully', async () => {
      usersService.findByIdOrFail.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await service.changeAdminPassword('user-123', 'currentPassword', 'newPassword');

      expect(usersService.setPassword).toHaveBeenCalledWith('user-123', 'newHashedPassword');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      usersService.findByIdOrFail.mockResolvedValue({
        ...mockUser,
        type: UserType.MEMBER,
      } as User);

      await expect(
        service.changeAdminPassword('user-123', 'current', 'new'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no password set', async () => {
      usersService.findByIdOrFail.mockResolvedValue({ ...mockUser, password: null } as User);

      await expect(
        service.changeAdminPassword('user-123', 'current', 'new'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      usersService.findByIdOrFail.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changeAdminPassword('user-123', 'wrongPassword', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
