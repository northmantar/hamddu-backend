import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@entities/user.entity';
import { XpWallet } from '@entities/xp-wallet.entity';
import { PointWallet } from '@entities/point-wallet.entity';
import { NicknameAdjective } from '@entities/nickname-adjective.entity';
import { NicknameNoun } from '@entities/nickname-noun.entity';
import { RedisService } from '../redis/redis.service';
import { NicknameSequenceService } from '../nicknames/nickname-sequence.service';
import { Platform, UserStatus, UserType, AgeRange, UserGender, UserInterests, UserAbility } from '../enums/user.enum';
import { SurveyDto } from './dto/survey.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let adjectiveRepo: jest.Mocked<Repository<NicknameAdjective>>;
  let nounRepo: jest.Mocked<Repository<NicknameNoun>>;
  let dataSource: jest.Mocked<DataSource>;
  let redisService: jest.Mocked<RedisService>;
  let nicknameSequenceService: jest.Mocked<NicknameSequenceService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    platform: Platform.GOOGLE,
    platformUserId: 'google-123',
    type: UserType.MEMBER,
    nickname: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      existsBy: jest.fn(),
    };

    const mockAdjectiveRepo = {
      findBy: jest.fn(),
    };

    const mockNounRepo = {
      findBy: jest.fn(),
    };

    const mockDataSource = {
      query: jest.fn(),
    };

    const mockRedisService = {
      smembers: jest.fn(),
      del: jest.fn(),
    };

    const mockNicknameSequenceService = {
      allocateSuffix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(NicknameAdjective), useValue: mockAdjectiveRepo },
        { provide: getRepositoryToken(NicknameNoun), useValue: mockNounRepo },
        { provide: getRepositoryToken(XpWallet), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(PointWallet), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: DataSource, useValue: mockDataSource },
        { provide: RedisService, useValue: mockRedisService },
        { provide: NicknameSequenceService, useValue: mockNicknameSequenceService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    adjectiveRepo = module.get(getRepositoryToken(NicknameAdjective));
    nounRepo = module.get(getRepositoryToken(NicknameNoun));
    dataSource = module.get(DataSource);
    redisService = module.get(RedisService);
    nicknameSequenceService = module.get(NicknameSequenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    });

    it('should return null if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdOrFail', () => {
    it('should return user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findByIdOrFail('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrFail('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findOrCreate(Platform.GOOGLE, 'google-123', 'test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should create new member user if not found and not first user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.count.mockResolvedValue(1);
      userRepo.create.mockReturnValue({ ...mockUser, type: UserType.MEMBER } as User);
      userRepo.save.mockResolvedValue({ ...mockUser, type: UserType.MEMBER } as User);

      const result = await service.findOrCreate(Platform.GOOGLE, 'google-456', 'new@example.com');

      expect(result.type).toBe(UserType.MEMBER);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should create admin user if first user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.count.mockResolvedValue(0);
      userRepo.create.mockReturnValue({ ...mockUser, type: UserType.ADMIN } as User);
      userRepo.save.mockResolvedValue({ ...mockUser, type: UserType.ADMIN } as User);

      const result = await service.findOrCreate(Platform.GOOGLE, 'google-456', 'new@example.com');

      expect(result.type).toBe(UserType.ADMIN);
    });
  });

  describe('completeSurvey', () => {
    it('should update user survey data', async () => {
      const surveyDto: SurveyDto = {
        age: AgeRange.AGE_2529,
        gender: UserGender.FEMALE,
        interests: UserInterests.CROCHET,
        ability: UserAbility.BEGINNER,
      };

      userRepo.findOne
        .mockResolvedValueOnce(mockUser as User)
        .mockResolvedValueOnce({ ...mockUser, ...surveyDto, surveyCompletedAt: new Date() } as User);

      const result = await service.completeSurvey('user-123', surveyDto);

      expect(userRepo.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        age: surveyDto.age,
        gender: surveyDto.gender,
        interests: surveyDto.interests,
        ability: surveyDto.ability,
      }));
      expect(result.age).toBe(surveyDto.age);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.completeSurvey('non-existent', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateNickname', () => {
    it('should generate unique nickname', async () => {
      adjectiveRepo.findBy.mockResolvedValue([{ word: 'Happy', isActive: true }] as NicknameAdjective[]);
      nounRepo.findBy.mockResolvedValue([{ word: 'Cat', isActive: true }] as NicknameNoun[]);
      userRepo.existsBy.mockResolvedValue(false);

      const result = await service.generateNickname();

      expect(result).toBe('Happy Cat');
    });

    it('should add suffix if nickname already taken', async () => {
      adjectiveRepo.findBy.mockResolvedValue([{ word: 'Happy', isActive: true }] as NicknameAdjective[]);
      nounRepo.findBy.mockResolvedValue([{ word: 'Cat', isActive: true }] as NicknameNoun[]);
      userRepo.existsBy.mockResolvedValue(true);
      nicknameSequenceService.allocateSuffix.mockResolvedValue(1);

      const result = await service.generateNickname();

      expect(result).toBe('Happy Cat1');
    });
  });

  describe('withdraw', () => {
    it('should update user status and clear redis tokens', async () => {
      redisService.smembers.mockResolvedValue(['hash1', 'hash2']);

      await service.withdraw('user-123');

      expect(userRepo.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        status: UserStatus.WITHDRAWN,
        nickname: null,
      }));
      expect(redisService.del).toHaveBeenCalledWith('rt:hash1', 'rt:hash2');
      expect(redisService.del).toHaveBeenCalledWith('user_rts:user-123');
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const users = [mockUser as User];
      userRepo.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAllUsers(1, 20);

      expect(result.data).toEqual(users);
      expect(result.totalCount).toBe(1);
      expect(userRepo.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('updateUserType', () => {
    it('should update user type', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.updateUserType('user-123', UserType.ADMIN);

      expect(userRepo.update).toHaveBeenCalledWith('user-123', { type: UserType.ADMIN });
      expect(result.type).toBe(UserType.ADMIN);
    });
  });
});
