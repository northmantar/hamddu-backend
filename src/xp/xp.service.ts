import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, LessThanOrEqual, MoreThan } from "typeorm";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { XpEarningPolicy } from "@entities/xp-earning-policy.entity";
import { XpActionTypeEntity } from "@entities/xp-action-type.entity";
import { User } from "@entities/user.entity";
import { EarnXpDto } from "./dto/earn-xp.dto";
import { CreateXpLevelDto } from "./dto/create-level.dto";
import { UpdateXpLevelDto } from "./dto/update-level.dto";
import { CreateXpPolicyDto, UpdateXpPolicyDto } from "./dto/xp-policy.dto";
import { CreateXpActionTypeDto, UpdateXpActionTypeDto } from "./dto/xp-action-type.dto";
import {
  REWARD_EVENTS,
  RewardEvent,
  isRegisteredRewardEvent,
} from "../rewards/constants/reward-events";
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
    @InjectRepository(XpEarningPolicy)
    private readonly earningPolicyRepo: Repository<XpEarningPolicy>,
    @InjectRepository(XpActionTypeEntity)
    private readonly actionTypeRepo: Repository<XpActionTypeEntity>,
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

  async getAllLevels(): Promise<XpLevelPolicy[]> {
    return this.policyRepo.find({
      order: { level: "ASC" },
    });
  }

  async findLevelById(id: string): Promise<XpLevelPolicy> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException("레벨 정책을 찾을 수 없습니다.");
    }
    return policy;
  }

  async createLevel(dto: CreateXpLevelDto): Promise<XpLevelPolicy> {
    const policy = this.policyRepo.create({
      level: dto.level,
      xpThreshold: dto.xpThreshold,
      label: dto.label,
      isActive: dto.isActive ?? true,
    });
    return this.policyRepo.save(policy);
  }

  async updateLevel(id: string, dto: UpdateXpLevelDto): Promise<XpLevelPolicy> {
    await this.findLevelById(id);

    await this.policyRepo.update(id, {
      ...(dto.xpThreshold !== undefined && { xpThreshold: dto.xpThreshold }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.findLevelById(id);
  }

  async deleteLevel(id: string): Promise<void> {
    await this.findLevelById(id);
    // 레벨 정책을 비활성화 처리 (soft delete)
    await this.policyRepo.update(id, { isActive: false });
  }

  // ─── XP 지급 정책 ────────────────────────────────────────────────────────
  async getEarningPolicies(): Promise<XpEarningPolicy[]> {
    return this.earningPolicyRepo.find({
      relations: ["actionTypeRef"],
      order: { createdAt: "ASC" },
    });
  }

  async findEarningPolicyById(id: string): Promise<XpEarningPolicy> {
    const policy = await this.earningPolicyRepo.findOne({
      where: { id },
      relations: ["actionTypeRef"],
    });
    if (!policy) {
      throw new NotFoundException("XP 지급 정책을 찾을 수 없습니다.");
    }
    return policy;
  }

  async createEarningPolicy(dto: CreateXpPolicyDto): Promise<XpEarningPolicy> {
    const actionType = await this.actionTypeRepo.findOne({ where: { code: dto.actionType } });
    if (!actionType) {
      throw new BadRequestException(`존재하지 않는 액션 타입입니다: ${dto.actionType}`);
    }
    const policy = this.earningPolicyRepo.create({
      actionType: dto.actionType,
      xpAmount: dto.xpAmount,
      isOneTime: dto.isOneTime ?? false,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.earningPolicyRepo.save(policy);
    return this.findEarningPolicyById(saved.id);
  }

  async updateEarningPolicy(id: string, dto: UpdateXpPolicyDto): Promise<XpEarningPolicy> {
    await this.findEarningPolicyById(id);
    await this.earningPolicyRepo.update(id, {
      ...(dto.xpAmount !== undefined && { xpAmount: dto.xpAmount }),
      ...(dto.isOneTime !== undefined && { isOneTime: dto.isOneTime }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return this.findEarningPolicyById(id);
  }

  async deleteEarningPolicy(id: string): Promise<void> {
    await this.findEarningPolicyById(id);
    await this.earningPolicyRepo.update(id, { isActive: false });
  }

  // ─── XP 액션 타입 (보상 카탈로그) ────────────────────────────────────────
  async getActionTypes(): Promise<XpActionTypeEntity[]> {
    return this.actionTypeRepo.find({ order: { code: "ASC" } });
  }

  /** 계측된 보상 이벤트 레지스트리 (포인트와 공유 — 동일 emit이 두 큐로 fan-out) */
  getRewardEvents(): readonly RewardEvent[] {
    return REWARD_EVENTS;
  }

  async createActionType(dto: CreateXpActionTypeDto): Promise<XpActionTypeEntity> {
    if (!isRegisteredRewardEvent(dto.refType, dto.refAction)) {
      throw new BadRequestException(
        `계측되지 않은 보상 이벤트입니다: (${dto.refType}, ${dto.refAction}). 레지스트리에 먼저 등록되어야 합니다.`,
      );
    }
    const exists = await this.actionTypeRepo.findOne({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`이미 존재하는 액션 코드입니다: ${dto.code}`);
    }
    const dup = await this.actionTypeRepo.findOne({
      where: { refType: dto.refType, refAction: dto.refAction },
    });
    if (dup) {
      throw new ConflictException(
        `이미 등록된 보상 이벤트입니다: (${dto.refType}, ${dto.refAction}) → ${dup.code}`,
      );
    }
    const at = this.actionTypeRepo.create({
      code: dto.code,
      labelKo: dto.labelKo,
      refType: dto.refType,
      refAction: dto.refAction,
      isActive: true,
    });
    return this.actionTypeRepo.save(at);
  }

  async updateActionType(code: string, dto: UpdateXpActionTypeDto): Promise<XpActionTypeEntity> {
    const at = await this.actionTypeRepo.findOne({ where: { code } });
    if (!at) {
      throw new NotFoundException(`액션 타입을 찾을 수 없습니다: ${code}`);
    }
    await this.actionTypeRepo.update(code, {
      ...(dto.labelKo !== undefined && { labelKo: dto.labelKo }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    const updated = await this.actionTypeRepo.findOne({ where: { code } });
    return updated!;
  }

  async deleteActionType(code: string): Promise<void> {
    const at = await this.actionTypeRepo.findOne({ where: { code } });
    if (!at) {
      throw new NotFoundException(`액션 타입을 찾을 수 없습니다: ${code}`);
    }
    const usedBy = await this.earningPolicyRepo.count({ where: { actionType: code } });
    if (usedBy > 0) {
      throw new ConflictException("이 액션 타입을 사용 중인 정책이 있어 삭제할 수 없습니다.");
    }
    await this.actionTypeRepo.delete(code);
  }
}
