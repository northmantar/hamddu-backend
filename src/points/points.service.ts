import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PointWallet } from "@entities/point-wallet.entity";
import { PointTransaction } from "@entities/point-transaction.entity";
import { PointEarningPolicy } from "@entities/point-earning-policy.entity";
import { PointActionTypeEntity } from "@entities/point-action-type.entity";
import { User } from "@entities/user.entity";
import { PointTransactionType, PointTransactionStatus } from "@enums/point.enum";
import { EarnPointDto } from "./dto/earn-point.dto";
import { CreatePointPolicyDto } from "./dto/create-policy.dto";
import { UpdatePointPolicyDto } from "./dto/update-policy.dto";
import { PointTransactionQueryDto } from "./dto/point-query.dto";
import { CreatePointActionTypeDto, UpdatePointActionTypeDto } from "./dto/action-type.dto";
import {
  REWARD_EVENTS,
  RewardEvent,
  isRegisteredRewardEvent,
} from "../rewards/constants/reward-events";
import { PaginationMeta } from "../boards/dto/pagination.dto";

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointWallet)
    private readonly walletRepo: Repository<PointWallet>,
    @InjectRepository(PointTransaction)
    private readonly transactionRepo: Repository<PointTransaction>,
    @InjectRepository(PointEarningPolicy)
    private readonly policyRepo: Repository<PointEarningPolicy>,
    @InjectRepository(PointActionTypeEntity)
    private readonly actionTypeRepo: Repository<PointActionTypeEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(memberId: string): Promise<PointWallet> {
    let wallet = await this.walletRepo.findOne({ where: { memberId } });

    if (!wallet) {
      wallet = this.walletRepo.create({ memberId });
      wallet = await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  async getTransactions(
    memberId: string,
    query: PointTransactionQueryDto,
  ): Promise<{ data: PointTransaction[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepo
      .createQueryBuilder("tx")
      .where("tx.memberId = :memberId", { memberId })
      .orderBy("tx.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (type) {
      qb.andWhere("tx.type = :type", { type });
    }

    const [data, totalCount] = await qb.getManyAndCount();

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

  async earn(dto: EarnPointDto): Promise<{ transaction: PointTransaction; newBalance: number }> {
    const user = await this.userRepo.findOne({ where: { id: dto.memberId } });
    if (!user) {
      throw new NotFoundException("유저를 찾을 수 없습니다.");
    }

    const policy = await this.policyRepo.findOne({ where: { id: dto.policyId } });
    if (!policy) {
      throw new NotFoundException("포인트 정책을 찾을 수 없습니다.");
    }

    const result = await this.dataSource.transaction(async (manager) => {
      let wallet = await manager.findOne(PointWallet, { where: { memberId: dto.memberId } });
      if (!wallet) {
        wallet = manager.create(PointWallet, { memberId: dto.memberId });
        wallet = await manager.save(wallet);
      }

      const expiredAt = new Date();
      expiredAt.setFullYear(expiredAt.getFullYear() + 1);

      const transaction = manager.create(PointTransaction, {
        memberId: dto.memberId,
        policyId: dto.policyId,
        walletId: wallet.id,
        refType: dto.refType,
        refId: dto.refId,
        type: PointTransactionType.EARN,
        status: PointTransactionStatus.COMPLETED,
        amount: policy.pointAmount,
        description: dto.description ?? null,
        expiredAt,
      });

      await manager.save(transaction);

      wallet.balance += policy.pointAmount;
      wallet.totalEarned += policy.pointAmount;
      await manager.save(wallet);

      return { transaction, newBalance: wallet.balance };
    });

    return result;
  }

  async getPolicies(): Promise<PointEarningPolicy[]> {
    return this.policyRepo.find({
      relations: ["actionTypeRef"],
      order: { createdAt: "ASC" },
    });
  }

  async findPolicyById(id: string): Promise<PointEarningPolicy> {
    const policy = await this.policyRepo.findOne({
      where: { id },
      relations: ["actionTypeRef"],
    });
    if (!policy) {
      throw new NotFoundException("포인트 정책을 찾을 수 없습니다.");
    }
    return policy;
  }

  async createPolicy(dto: CreatePointPolicyDto): Promise<PointEarningPolicy> {
    const actionType = await this.actionTypeRepo.findOne({ where: { code: dto.actionType } });
    if (!actionType) {
      throw new BadRequestException(`존재하지 않는 액션 타입입니다: ${dto.actionType}`);
    }

    const policy = this.policyRepo.create({
      actionType: dto.actionType,
      pointAmount: dto.pointAmount,
      isOneTime: dto.isOneTime ?? false,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.policyRepo.save(policy);
    return this.findPolicyById(saved.id);
  }

  async updatePolicy(id: string, dto: UpdatePointPolicyDto): Promise<PointEarningPolicy> {
    await this.findPolicyById(id);

    await this.policyRepo.update(id, {
      ...(dto.pointAmount !== undefined && { pointAmount: dto.pointAmount }),
      ...(dto.isOneTime !== undefined && { isOneTime: dto.isOneTime }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    return this.findPolicyById(id);
  }

  async deletePolicy(id: string): Promise<void> {
    await this.findPolicyById(id);
    await this.policyRepo.update(id, { isActive: false });
  }

  async getActionTypes(): Promise<PointActionTypeEntity[]> {
    return this.actionTypeRepo.find({ order: { code: "ASC" } });
  }

  /** 코드에 계측된(emit 되는) 보상 이벤트 레지스트리 — 어드민 카탈로그 생성 시 선택지 */
  getRewardEvents(): readonly RewardEvent[] {
    return REWARD_EVENTS;
  }

  async createActionType(dto: CreatePointActionTypeDto): Promise<PointActionTypeEntity> {
    // 레지스트리 검증: 실제로 emit 되는 (refType, refAction) 만 카탈로그 생성 허용
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

  async updateActionType(code: string, dto: UpdatePointActionTypeDto): Promise<PointActionTypeEntity> {
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
    const usedBy = await this.policyRepo.count({ where: { actionType: code } });
    if (usedBy > 0) {
      throw new ConflictException("이 액션 타입을 사용 중인 정책이 있어 삭제할 수 없습니다.");
    }
    await this.actionTypeRepo.delete(code);
  }
}
