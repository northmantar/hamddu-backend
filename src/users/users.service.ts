import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, IsNull, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { XpWallet } from '@entities/xp-wallet.entity';
import { PointWallet } from '@entities/point-wallet.entity';
import { NicknameAdjective } from '@entities/nickname-adjective.entity';
import { NicknameNoun } from '@entities/nickname-noun.entity';
import { Media } from '@entities/media.entity';
import { DeviceToken } from '@entities/device-token.entity';
import { Platform, UserStatus, UserType } from '../enums/user.enum';
import { WITHDRAWN_NAME } from './user-display';
import { UpdateMeDto } from './dto/update-me.dto';
import { SurveyDto } from './dto/survey.dto';
import { RedisService } from '../redis/redis.service';
import { NicknameSequenceService } from '../nicknames/nickname-sequence.service';
import { RewardsService } from '../rewards/rewards.service';
import { RewardAction } from '../rewards/constants/reward-events';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NicknameAdjective)
    private readonly adjectiveRepo: Repository<NicknameAdjective>,
    @InjectRepository(NicknameNoun)
    private readonly nounRepo: Repository<NicknameNoun>,
    @InjectRepository(XpWallet)
    private readonly xpWalletRepo: Repository<XpWallet>,
    @InjectRepository(PointWallet)
    private readonly pointWalletRepo: Repository<PointWallet>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    private readonly redis: RedisService,
    private readonly nicknameSequenceService: NicknameSequenceService,
    private readonly rewardsService: RewardsService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }


  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOrCreate(
    platform: Platform,
    platformUserId: string,
    email: string,
  ): Promise<User> {
    // 서비스 로그인은 항상 MEMBER row만 찾고/만든다. 같은 소셜 계정이 admin으로 승격돼도
    // 어드민 row를 재사용하지 않고 별도 member row를 생성한다.
    const existing = await this.userRepo.findOne({
      where: { platform, platformUserId, type: UserType.MEMBER },
    });
    if (existing) return existing;

    const user = this.userRepo.create({
      platform,
      platformUserId,
      email,
      type: UserType.MEMBER,
    });
    const saved = await this.userRepo.save(user);

    // 회원가입 보상 (포인트 + XP 큐로 fan-out)
    await this.rewardsService.enqueueReward({
      memberId: saved.id,
      refType: 'users',
      refAction: RewardAction.CREATE,
      refId: saved.id,
    });

    return saved;
  }

  /** 내 프로필 수정 (닉네임 / 프로필 이미지). 전달된 필드만 반영된다. */
  async updateMe(userId: string, dto: UpdateMeDto): Promise<User> {
    if (dto.profileMediaId) {
      const exists = await this.mediaRepo.existsBy({ id: dto.profileMediaId });
      if (!exists) throw new BadRequestException('유효하지 않은 미디어 ID입니다.');
    }

    if (dto.nickname !== undefined) {
      await this.nicknameSequenceService.claimNicknameWithSuffix(userId, dto.nickname);
    }

    if (dto.profileMediaId !== undefined) {
      await this.userRepo.update(userId, { profileMediaId: dto.profileMediaId });
    }

    return this.findByIdOrFail(userId);
  }

  async completeSurvey(userId: string, dto: SurveyDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(userId, {
      age: dto.age,
      gender: dto.gender,
      interests: dto.interests,
      ability: dto.ability,
      surveyCompletedAt: user.surveyCompletedAt ?? new Date(),
    });
    const updated = await this.userRepo.findOne({ where: { id: userId } });
    if (!updated) throw new InternalServerErrorException('User disappeared after update');
    return updated;
  }

  async generateNickname(): Promise<string> {
    const [adjectives, nouns] = await Promise.all([
      this.adjectiveRepo.findBy({ isActive: true }),
      this.nounRepo.findBy({ isActive: true }),
    ]);

    if (!adjectives.length || !nouns.length) {
      throw new InternalServerErrorException('Nickname word pool is empty');
    }

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)].word;
    const noun = nouns[Math.floor(Math.random() * nouns.length)].word;
    const base = `${adj} ${noun}`;

    const isTaken = await this.userRepo.existsBy({ nickname: base });
    if (!isTaken) {
      return base;
    }

    const suffix = await this.nicknameSequenceService.allocateSuffix(base);
    return `${base}${suffix}`;
  }

  async withdraw(userId: string): Promise<void> {
    // 재가입 시 이전 계정과 연결되지 않도록 식별자를 모두 익명화한다.
    // 게시글/댓글은 user_id FK로 남아 그대로 노출된다.
    await this.userRepo.update(userId, {
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date(),
      platformUserId: null,
      email: null,
      name: WITHDRAWN_NAME,
      nickname: null,
      profileMediaId: null,
    });

    await this.deviceTokenRepo.delete({ userId });

    const hashes = await this.redis.smembers(`user_rts:${userId}`);
    await this.redis.del(...hashes.map((h) => `rt:${h}`));
    await this.redis.del(`user_rts:${userId}`);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findAdminByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email, type: UserType.ADMIN },
    });
  }

  async countAdmins(): Promise<number> {
    return this.userRepo.count({
      where: { type: UserType.ADMIN, password: Not(IsNull()) },
    });
  }

  async createUser(email: string, hashedPassword: string, type: UserType): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email, type } });
    if (existing) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      type,
      platform: null,
      platformUserId: null,
    });
    return this.userRepo.save(user);
  }

  async createAdminUser(email: string, hashedPassword: string): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email, type: UserType.ADMIN },
    });

    if (existing) {
      if (existing.password) {
        throw new ConflictException('이미 등록된 어드민 이메일입니다.');
      }
      // 비밀번호 없는 admin(OAuth로 생성)이면 비밀번호만 설정
      await this.userRepo.update(existing.id, { password: hashedPassword });
      return { ...existing, password: hashedPassword };
    }

    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      type: UserType.ADMIN,
      platform: null,
      platformUserId: null,
    });
    return this.userRepo.save(user);
  }

  async setPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(userId, { password: hashedPassword });
  }

  async updateUserType(userId: string, type: UserType): Promise<User> {
    const user = await this.findByIdOrFail(userId);
    await this.userRepo.update(userId, { type });
    return { ...user, type };
  }

  async findAllUsers(
    page: number,
    limit: number,
    type?: UserType,
  ): Promise<{ data: User[]; totalCount: number }> {
    const [data, totalCount] = await this.userRepo.findAndCount({
      where: type ? { type } : undefined,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, totalCount };
  }

  async findMembersWithWallets(
    page: number,
    limit: number,
  ): Promise<{ data: (User & { xp: number; points: number })[]; totalCount: number }> {
    const [users, totalCount] = await this.userRepo.findAndCount({
      where: { type: UserType.MEMBER },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (users.length === 0) return { data: [], totalCount };

    const userIds = users.map((u) => u.id);
    const [xpWallets, pointWallets] = await Promise.all([
      this.xpWalletRepo.find({ where: { memberId: In(userIds) }, select: ['memberId', 'totalXp'] }),
      this.pointWalletRepo.find({ where: { memberId: In(userIds) }, select: ['memberId', 'balance'] }),
    ]);

    const xpMap = new Map(xpWallets.map((w) => [w.memberId, w.totalXp]));
    const pointMap = new Map(pointWallets.map((w) => [w.memberId, w.balance]));

    const data = users.map((user) => ({
      ...user,
      xp: xpMap.get(user.id) ?? 0,
      points: pointMap.get(user.id) ?? 0,
    }));

    return { data, totalCount };
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    await this.findByIdOrFail(userId);
    await this.userRepo.update(userId, { status });
  }

  async findAdminById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id, type: UserType.ADMIN } });
    if (!user) throw new NotFoundException('어드민 유저를 찾을 수 없습니다.');
    return user;
  }

  async deleteAdmin(userId: string): Promise<void> {
    await this.userRepo.delete(userId);
  }
}
