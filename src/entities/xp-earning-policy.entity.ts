import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { XpActionTypeEntity } from "./xp-action-type.entity";

@Entity("xp_earning_policies")
export class XpEarningPolicy {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50 })
  actionType: string;

  @ManyToOne(() => XpActionTypeEntity, (t) => t.policies, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "action_type", referencedColumnName: "code" })
  actionTypeRef: XpActionTypeEntity;

  @Column({ type: "int" })
  xpAmount: number;

  @Column({ default: false })
  isOneTime: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
