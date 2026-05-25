import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, IsNull, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { NicknameAdjective } from '@entities/nickname-adjective.entity';
import { NicknameNoun } from '@entities/nickname-noun.entity';
import { Platform, UserStatus, UserType } from '../enums/user.enum';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { SurveyDto } from './dto/survey.dto';
import { RedisService } from '../redis/redis.service';
import { NicknameSequenceService } from '../nicknames/nickname-sequence.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NicknameAdjective)
    private readonly adjectiveRepo: Repository<NicknameAdjective>,
    @InjectRepository(NicknameNoun)
    private readonly nounRepo: Repository<NicknameNoun>,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
    private readonly nicknameSequenceService: NicknameSequenceService,
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
    const existing = await this.userRepo.findOne({ where: { platform, platformUserId } });
    if (existing) return existing;

    const user = this.userRepo.create({
      platform,
      platformUserId,
      email,
      type: UserType.MEMBER,
    });
    return this.userRepo.save(user);
  }

  async updateNickname(userId: string, dto: UpdateNicknameDto): Promise<User> {
    const base = dto.nickname;

    if (await this.tryUpdateNickname(userId, base)) {
      return this.findByIdOrFail(userId);
    }

    while (true) {
      const suffix = await this.nicknameSequenceService.allocateSuffix(base);
      const nickname = `${base}${suffix}`;
      if (await this.tryUpdateNickname(userId, nickname)) {
        return this.findByIdOrFail(userId);
      }
    }
  }

  private async tryUpdateNickname(userId: string, nickname: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE users SET nickname = $1
       WHERE id = $2
         AND NOT EXISTS (
           SELECT 1 FROM users WHERE nickname = $1 AND id != $2
         )
       RETURNING id`,
      [nickname, userId],
    );
    return result.length > 0;
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
    await this.userRepo.update(userId, {
      status: UserStatus.WITHDRAWN,
      withdrawnAt: new Date(),
      nickname: null,
    });

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

  async findAllUsers(page: number, limit: number): Promise<{ data: User[]; totalCount: number }> {
    const [data, totalCount] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, totalCount };
  }
}
