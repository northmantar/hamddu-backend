import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PointTransactionType, PointTransactionStatus, PointActionType } from "@enums/point.enum";
import { PointWallet } from "@entities/point-wallet.entity";
import { PointTransaction } from "@entities/point-transaction.entity";
import { PointEarningPolicy } from "@entities/point-earning-policy.entity";

export class PointWalletResponseDto {
  @ApiProperty({ example: "wallet-uuid" })
  id: string;

  @ApiProperty({ example: 1500 })
  balance: number;

  @ApiProperty({ example: 2000 })
  totalEarned: number;

  @ApiProperty({ example: 500 })
  totalUsed: number;

  @ApiProperty({ example: "2026-04-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  updatedAt: Date;

  static from(wallet: PointWallet): PointWalletResponseDto {
    return {
      id: wallet.id,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalUsed: wallet.totalUsed,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}

export class PointTransactionResponseDto {
  @ApiProperty({ example: "transaction-uuid" })
  id: string;

  @ApiProperty({ enum: PointTransactionType })
  type: PointTransactionType;

  @ApiProperty({ enum: PointTransactionStatus })
  status: PointTransactionStatus;

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiPropertyOptional({ example: "챌린지 완료 보상" })
  description: string | null;

  @ApiPropertyOptional({ example: "challenge" })
  refType: string | null;

  @ApiPropertyOptional({ example: "challenge-uuid" })
  refId: string | null;

  @ApiPropertyOptional({ example: "2027-04-09T16:00:00.000Z" })
  expiredAt: Date | null;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;

  static from(tx: PointTransaction): PointTransactionResponseDto {
    return {
      id: tx.id,
      type: tx.type,
      status: tx.status,
      amount: tx.amount,
      description: tx.description,
      refType: tx.refType,
      refId: tx.refId,
      expiredAt: tx.expiredAt,
      createdAt: tx.createdAt,
    };
  }
}

export class PointEarnResponseDto {
  @ApiProperty({ example: "transaction-uuid" })
  id: string;

  @ApiProperty({ enum: PointTransactionType })
  type: PointTransactionType;

  @ApiProperty({ enum: PointTransactionStatus })
  status: PointTransactionStatus;

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiPropertyOptional({ example: "챌린지 완료 보상" })
  description: string | null;

  @ApiProperty({ example: 1600 })
  newBalance: number;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;
}

export class PointPolicyResponseDto {
  @ApiProperty({ example: "policy-uuid" })
  id: string;

  @ApiProperty({ enum: PointActionType })
  actionType: PointActionType;

  @ApiProperty({ example: 100 })
  pointAmount: number;

  @ApiProperty({ example: false })
  isOneTime: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  updatedAt: Date;

  static from(policy: PointEarningPolicy): PointPolicyResponseDto {
    return {
      id: policy.id,
      actionType: policy.actionType,
      pointAmount: policy.pointAmount,
      isOneTime: policy.isOneTime,
      isActive: policy.isActive,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}
