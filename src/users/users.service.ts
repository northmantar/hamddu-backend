import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform, User, UserStatus } from './entities/user.entity';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { SurveyDto } from './dto/survey.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOrCreate(
    platform: Platform,
    platformUserId: string,
    email: string,
  ): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { platform, platformUserId } });
    if (existing) return existing;

    const user = this.userRepo.create({ platform, platformUserId, email });
    return this.userRepo.save(user);
  }

  async updateNickname(userId: string, dto: UpdateNicknameDto): Promise<User> {
    const taken = await this.userRepo.findOne({ where: { nickname: dto.nickname } });
    if (taken && taken.id !== userId) {
      throw new ConflictException('Nickname already taken');
    }
    await this.userRepo.update(userId, { nickname: dto.nickname });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async completeSurvey(userId: string, dto: SurveyDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(userId, {
      age: dto.age,
      surveyCompletedAt: user.surveyCompletedAt ?? new Date(),
    });
    return this.userRepo.findOne({ where: { id: userId } });
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
}
