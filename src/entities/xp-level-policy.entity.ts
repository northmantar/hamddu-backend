import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { XpWallet } from "./xp-wallet.entity";

@Entity("xp_level_policies")
export class XpLevelPolicy {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", unique: true })
  level: number;

  @Column({ type: "int" })
  xpThreshold: number;

  @Column({ length: 100 })
  label: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => XpWallet, (wallet) => wallet.policy)
  wallets: XpWallet[];
}
