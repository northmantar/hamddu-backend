import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PointEarningPolicy } from "./point-earning-policy.entity";

@Entity("point_action_types")
export class PointActionTypeEntity {
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

  @OneToMany(() => PointEarningPolicy, (p) => p.actionTypeRef)
  policies: PointEarningPolicy[];
}
