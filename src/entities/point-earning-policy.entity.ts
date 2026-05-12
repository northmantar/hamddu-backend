import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PointActionType } from "@enums/point.enum";
import { PointTransaction } from "./point-transaction.entity";

@Entity("point_earning_policies")
export class PointEarningPolicy {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: PointActionType })
  actionType: PointActionType;

  @Column({ type: "int" })
  pointAmount: number;

  @Column({ default: false })
  isOneTime: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PointTransaction, (tx) => tx.policy)
  transactions: PointTransaction[];
}
