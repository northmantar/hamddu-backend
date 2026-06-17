import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { XpEarningPolicy } from "@entities/xp-earning-policy.entity";
import { XpActionTypeEntity } from "@entities/xp-action-type.entity";

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

export class XpEarningPolicyResponseDto {
  @ApiProperty({ example: "policy-uuid" })
  id: string;

  @ApiProperty({ example: "SIGNUP" })
  actionType: string;

  @ApiPropertyOptional({ example: "회원가입" })
  actionTypeLabelKo: string | null;

  @ApiProperty({ example: 100 })
  xpAmount: number;

  @ApiProperty({ example: false })
  isOneTime: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  updatedAt: Date;

  static from(policy: XpEarningPolicy): XpEarningPolicyResponseDto {
    return {
      id: policy.id,
      actionType: policy.actionType,
      actionTypeLabelKo: policy.actionTypeRef?.labelKo ?? null,
      xpAmount: policy.xpAmount,
      isOneTime: policy.isOneTime,
      isActive: policy.isActive,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}

export class XpActionTypeResponseDto {
  @ApiProperty({ example: "SIGNUP" })
  code: string;

  @ApiProperty({ example: "회원가입" })
  labelKo: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  updatedAt: Date;

  static from(at: XpActionTypeEntity): XpActionTypeResponseDto {
    return {
      code: at.code,
      labelKo: at.labelKo,
      isActive: at.isActive,
      createdAt: at.createdAt,
      updatedAt: at.updatedAt,
    };
  }
}
