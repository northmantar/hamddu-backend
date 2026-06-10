import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { PointTransaction } from "./point-transaction.entity";

@Entity("point_wallets")
export class PointWallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  memberId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @Column({ type: "int", default: 0 })
  balance: number;

  @Column({ type: "int", default: 0 })
  totalEarned: number;

  @Column({ type: "int", default: 0 })
  totalUsed: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PointTransaction, (tx) => tx.wallet)
  transactions: PointTransaction[];
}
