import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { XpEarningPolicy } from "./xp-earning-policy.entity";

@Entity("xp_action_types")
export class XpActionTypeEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 100 })
  labelKo: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => XpEarningPolicy, (p) => p.actionTypeRef)
  policies: XpEarningPolicy[];
}
