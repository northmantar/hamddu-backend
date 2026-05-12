import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { XpLevelPolicy } from "./xp-level-policy.entity";
import { XpTransaction } from "./xp-transaction.entity";

@Entity("xp_wallets")
export class XpWallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  memberId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "memberId" })
  member: User;

  @Column()
  policyId: string;

  @ManyToOne(() => XpLevelPolicy, (policy) => policy.wallets)
  @JoinColumn({ name: "policyId" })
  policy: XpLevelPolicy;

  @Column({ type: "int", default: 0 })
  totalXp: number;

  @Column({ type: "int", default: 1 })
  currentLevel: number;

  @Column({ type: "int", default: 0 })
  xpToNextLevel: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => XpTransaction, (tx) => tx.wallet)
  transactions: XpTransaction[];
}
