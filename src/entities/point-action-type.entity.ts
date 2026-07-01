import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PointEarningPolicy } from "./point-earning-policy.entity";
import { RewardAction } from "../rewards/constants/reward-events";

@Entity("point_action_types")
export class PointActionTypeEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 100 })
  labelKo: string;

  /** 보상 이벤트가 발생하는 참조 테이블명 (예: board) */
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

  @OneToMany(() => PointEarningPolicy, (p) => p.actionTypeRef)
  policies: PointEarningPolicy[];
}
