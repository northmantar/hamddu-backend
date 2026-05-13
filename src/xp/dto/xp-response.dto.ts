import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";

export class XpWalletResponseDto {
  @ApiProperty({ example: "wallet-uuid" })
  id: string;

  @ApiProperty({ example: 1250 })
  totalXp: number;

  @ApiProperty({ example: 5 })
  currentLevel: number;

  @ApiPropertyOptional({ example: "초급 뜨개러" })
  levelLabel?: string;

  @ApiProperty({ example: 250 })
  xpToNextLevel: number;

  @ApiPropertyOptional({ example: 1500 })
  nextLevelThreshold?: number;

  @ApiProperty({ example: "2026-04-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  updatedAt: Date;

  static from(wallet: XpWallet, nextLevelPolicy?: XpLevelPolicy): XpWalletResponseDto {
    return {
      id: wallet.id,
      totalXp: wallet.totalXp,
      currentLevel: wallet.currentLevel,
      levelLabel: wallet.policy?.label,
      xpToNextLevel: wallet.xpToNextLevel,
      nextLevelThreshold: nextLevelPolicy?.xpThreshold,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}

export class XpTransactionResponseDto {
  @ApiProperty({ example: "transaction-uuid" })
  id: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiPropertyOptional({ example: "챌린지 완료" })
  description: string | null;

  @ApiPropertyOptional({ example: "challenge" })
  refType: string | null;

  @ApiPropertyOptional({ example: "challenge-uuid" })
  refId: string | null;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;

  static from(tx: XpTransaction): XpTransactionResponseDto {
    return {
      id: tx.id,
      amount: tx.amount,
      description: tx.description,
      refType: tx.refType,
      refId: tx.refId,
      createdAt: tx.createdAt,
    };
  }
}

export class XpEarnResponseDto {
  @ApiProperty({ example: "transaction-uuid" })
  id: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiPropertyOptional({ example: "챌린지 완료" })
  description: string | null;

  @ApiProperty({ example: 1300 })
  newTotalXp: number;

  @ApiProperty({ example: 5 })
  newLevel: number;

  @ApiProperty({ example: false })
  leveledUp: boolean;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;
}

export class XpLevelPolicyResponseDto {
  @ApiProperty({ example: "policy-uuid" })
  id: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: 0 })
  xpThreshold: number;

  @ApiProperty({ example: "새싹 뜨개러" })
  label: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  static from(policy: XpLevelPolicy): XpLevelPolicyResponseDto {
    return {
      id: policy.id,
      level: policy.level,
      xpThreshold: policy.xpThreshold,
      label: policy.label,
      isActive: policy.isActive,
    };
  }
}
