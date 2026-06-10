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
import { XpLevelPolicy } from "./xp-level-policy.entity";

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

  @Column()
  policyId: string;

  @ManyToOne(() => XpLevelPolicy)
  @JoinColumn({ name: "policy_id" })
  policy: XpLevelPolicy;

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
