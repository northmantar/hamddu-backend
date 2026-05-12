import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PointTransactionType, PointTransactionStatus } from "@enums/point.enum";
import { User } from "./user.entity";
import { PointEarningPolicy } from "./point-earning-policy.entity";
import { PointWallet } from "./point-wallet.entity";
import { PointUseDetail } from "./point-use-detail.entity";

@Entity("point_transactions")
export class PointTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "memberId" })
  member: User;

  @Column({ nullable: true })
  policyId: string | null;

  @ManyToOne(() => PointEarningPolicy, (policy) => policy.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: "policyId" })
  policy: PointEarningPolicy | null;

  @Column({ nullable: true })
  walletId: string | null;

  @ManyToOne(() => PointWallet, (wallet) => wallet.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: "walletId" })
  wallet: PointWallet | null;

  @Column({ type: "uuid", nullable: true })
  refId: string | null;

  @Column({ type: "varchar", nullable: true })
  refType: string | null;

  @Column({ type: "uuid", nullable: true })
  cancelTargetId: string | null;

  @ManyToOne(() => PointTransaction, { nullable: true })
  @JoinColumn({ name: "cancelTargetId" })
  cancelTarget: PointTransaction | null;

  @Column({ type: "enum", enum: PointTransactionType })
  type: PointTransactionType;

  @Column({
    type: "enum",
    enum: PointTransactionStatus,
    default: PointTransactionStatus.COMPLETED,
  })
  status: PointTransactionStatus;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "int" })
  amount: number;

  @Column({ type: "timestamptz", nullable: true })
  expiredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PointUseDetail, (detail) => detail.useTx)
  useDetails: PointUseDetail[];

  @OneToMany(() => PointUseDetail, (detail) => detail.earnTx)
  earnDetails: PointUseDetail[];
}
