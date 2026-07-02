import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { XpEarningPolicy } from "./xp-earning-policy.entity";
import { RewardAction } from "../rewards/constants/reward-events";

@Entity("xp_action_types")
export class XpActionTypeEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 100 })
  labelKo: string;

  /** 보상 이벤트가 발생하는 참조 테이블(또는 논리 이벤트)명 */
  @Column({ type: "varchar", length: 50 })
  refType: string;

  /** 보상 이벤트의 CRUD 액션 */
  @Column({ type: "enum", enum: RewardAction })
  refAction: RewardAction;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => XpEarningPolicy, (p) => p.actionTypeRef)
  policies: XpEarningPolicy[];
}
