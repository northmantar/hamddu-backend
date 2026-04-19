import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import {
  UserStatus,
  UserType,
  Platform,
  AgeRange,
  UserGender,
  UserInterests,
  UserAbility,
} from "@enums/user.enum";

@Entity("users")
@Unique(["platform", "platformUserId"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: "enum", enum: UserType, default: UserType.MEMBER })
  type: UserType;

  @Column({ nullable: true })
  platformUserId: string | null;

  @Column({ type: "enum", enum: Platform, nullable: true })
  platform: Platform | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  name: string | null;

  @Column({ unique: true, nullable: true, length: 30 })
  nickname: string | null;

  @Column({ type: "enum", enum: AgeRange, nullable: true })
  age: AgeRange | null;

  @Column({ type: "enum", enum: UserGender, nullable: true })
  gender: UserGender | null;

  @Column({ type: "enum", enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @Column({ type: "enum", enum: UserAbility, nullable: true })
  ability: UserAbility | null;

  @Column({ type: "timestamptz", nullable: true })
  surveyCompletedAt: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  withdrawnAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
