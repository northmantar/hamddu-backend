import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, LessThanOrEqual, MoreThan } from "typeorm";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { User } from "@entities/user.entity";
import { EarnXpDto } from "./dto/earn-xp.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";

@Injectable()
export class XpService {
  constructor(
    @InjectRepository(XpWallet)
    private readonly walletRepo: Repository<XpWallet>,
    @InjectRepository(XpTransaction)
    private readonly transactionRepo: Repository<XpTransaction>,
    @InjectRepository(XpLevelPolicy)
    private readonly policyRepo: Repository<XpLevelPolicy>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(memberId: string): Promise<{ wallet: XpWallet; nextLevelPolicy?: XpLevelPolicy }> {
    let wallet = await this.walletRepo.findOne({
      where: { memberId },
      relations: ["policy"],
    });

    if (!wallet) {
      // 지갑이 없으면 생성 (레벨 1 정책 조회)
      const level1Policy = await this.policyRepo.findOne({ where: { level: 1, isActive: true } });

      if (!level1Policy) {
        throw new NotFoundException("레벨 정책이 설정되지 않았습니다.");
      }

      wallet = this.walletRepo.create({
        memberId,
        policyId: level1Policy.id,
        currentLevel: 1,
        xpToNextLevel: 0,
      });
      wallet = await this.walletRepo.save(wallet);
      wallet.policy = level1Policy;
    }

    // 다음 레벨 정책 조회
    const nextLevelPolicy = await this.policyRepo.findOne({
      where: { level: wallet.currentLevel + 1, isActive: true },
    });

    // xpToNextLevel 계산
    if (nextLevelPolicy) {
      wallet.xpToNextLevel = nextLevelPolicy.xpThreshold - wallet.totalXp;
    }

    return { wallet, nextLevelPolicy: nextLevelPolicy ?? undefined };
  }

  async getTransactions(
    memberId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: XpTransaction[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.transactionRepo.findAndCount({
      where: { memberId },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async earn(dto: EarnXpDto): Promise<{
    transaction: XpTransaction;
    newTotalXp: number;
    newLevel: number;
    leveledUp: boolean;
  }> {
    // 유저 존재 여부 확인
    const user = await this.userRepo.findOne({ where: { id: dto.memberId } });
    if (!user) {
      throw new NotFoundException("유저를 찾을 수 없습니다.");
    }

    // 트랜잭션으로 처리
    const result = await this.dataSource.transaction(async (manager) => {
      // 지갑 조회 또는 생성
      let wallet = await manager.findOne(XpWallet, {
        where: { memberId: dto.memberId },
        relations: ["policy"],
      });

      if (!wallet) {
        const level1Policy = await manager.findOne(XpLevelPolicy, {
          where: { level: 1, isActive: true },
        });

        if (!level1Policy) {
          throw new NotFoundException("레벨 정책이 설정되지 않았습니다.");
        }

        wallet = manager.create(XpWallet, {
          memberId: dto.memberId,
          policyId: level1Policy.id,
          currentLevel: 1,
        });
        wallet = await manager.save(wallet);
        wallet.policy = level1Policy;
      }

      const oldLevel = wallet.currentLevel;

      // XP 추가
      wallet.totalXp += dto.amount;

      // 레벨업 확인
      const newPolicy = await manager.findOne(XpLevelPolicy, {
        where: {
          xpThreshold: LessThanOrEqual(wallet.totalXp),
          isActive: true,
        },
        order: { level: "DESC" },
      });

      if (newPolicy && newPolicy.level > wallet.currentLevel) {
        wallet.currentLevel = newPolicy.level;
        wallet.policyId = newPolicy.id;
      }

      // 다음 레벨까지 남은 XP 계산
      const nextPolicy = await manager.findOne(XpLevelPolicy, {
        where: {
          level: wallet.currentLevel + 1,
          isActive: true,
        },
      });

      wallet.xpToNextLevel = nextPolicy ? nextPolicy.xpThreshold - wallet.totalXp : 0;

      await manager.save(wallet);

      // XP 트랜잭션 생성
      const transaction = manager.create(XpTransaction, {
        memberId: dto.memberId,
        walletId: wallet.id,
        policyId: wallet.policyId,
        refType: dto.refType,
        refId: dto.refId,
        amount: dto.amount,
        description: dto.description ?? null,
      });

      await manager.save(transaction);

      return {
        transaction,
        newTotalXp: wallet.totalXp,
        newLevel: wallet.currentLevel,
        leveledUp: wallet.currentLevel > oldLevel,
      };
    });

    return result;
  }

  async getLevels(): Promise<XpLevelPolicy[]> {
    return this.policyRepo.find({
      where: { isActive: true },
      order: { level: "ASC" },
    });
  }
}
