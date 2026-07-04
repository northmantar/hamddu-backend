import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { XpWallet } from "./xp-wallet.entity";
import { XpEarningPolicy } from "./xp-earning-policy.entity";

@Entity("xp_transactions")
export class XpTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @Column()
  walletId: string;

  @ManyToOne(() => XpWallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: "wallet_id" })
  wallet: XpWallet;

  /** 이 XP를 지급한 적립 정책 (수동 지급 등은 null) */
  @Column({ type: "uuid", nullable: true })
  earningPolicyId: string | null;

  @ManyToOne(() => XpEarningPolicy, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "earning_policy_id" })
  earningPolicy: XpEarningPolicy | null;

  @Column({ type: "uuid", nullable: true })
  refId: string | null;

  @Column({ type: "varchar", nullable: true })
  refType: string | null;

  @Column({ type: "int" })
  amount: number;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
