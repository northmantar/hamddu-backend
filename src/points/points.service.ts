import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PointWallet } from "@entities/point-wallet.entity";
import { PointTransaction } from "@entities/point-transaction.entity";
import { PointEarningPolicy } from "@entities/point-earning-policy.entity";
import { User } from "@entities/user.entity";
import { PointTransactionType, PointTransactionStatus } from "@enums/point.enum";
import { EarnPointDto } from "./dto/earn-point.dto";
import { CreatePointPolicyDto } from "./dto/create-policy.dto";
import { UpdatePointPolicyDto } from "./dto/update-policy.dto";
import { PointTransactionQueryDto } from "./dto/point-query.dto";
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getWallet(memberId: string): Promise<PointWallet> {
    let wallet = await this.walletRepo.findOne({ where: { memberId } });

    if (!wallet) {
      // 지갑이 없으면 생성
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
    // 유저 존재 여부 확인
    const user = await this.userRepo.findOne({ where: { id: dto.memberId } });
    if (!user) {
      throw new NotFoundException("유저를 찾을 수 없습니다.");
    }

    // 정책 존재 여부 확인
    const policy = await this.policyRepo.findOne({ where: { id: dto.policyId } });
    if (!policy) {
      throw new NotFoundException("포인트 정책을 찾을 수 없습니다.");
    }

    // 트랜잭션으로 처리
    const result = await this.dataSource.transaction(async (manager) => {
      // 지갑 조회 또는 생성
      let wallet = await manager.findOne(PointWallet, { where: { memberId: dto.memberId } });
      if (!wallet) {
        wallet = manager.create(PointWallet, { memberId: dto.memberId });
        wallet = await manager.save(wallet);
      }

      // 포인트 트랜잭션 생성
      const expiredAt = new Date();
      expiredAt.setFullYear(expiredAt.getFullYear() + 1); // 1년 후 만료

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

      // 지갑 업데이트
      wallet.balance += policy.pointAmount;
      wallet.totalEarned += policy.pointAmount;
      await manager.save(wallet);

      return { transaction, newBalance: wallet.balance };
    });

    return result;
  }

  async getPolicies(): Promise<PointEarningPolicy[]> {
    return this.policyRepo.find({
      order: { createdAt: "ASC" },
    });
  }

  async findPolicyById(id: string): Promise<PointEarningPolicy> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException("포인트 정책을 찾을 수 없습니다.");
    }
    return policy;
  }

  async createPolicy(dto: CreatePointPolicyDto): Promise<PointEarningPolicy> {
    const policy = this.policyRepo.create({
      actionType: dto.actionType,
      pointAmount: dto.pointAmount,
      isOneTime: dto.isOneTime ?? false,
      isActive: dto.isActive ?? true,
    });
    return this.policyRepo.save(policy);
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
    // 정책을 비활성화 처리 (soft delete)
    await this.policyRepo.update(id, { isActive: false });
  }
}
