import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Media } from "./media.entity";
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
@Unique(["platform", "platformUserId", "type"])
@Unique(["email", "type"])
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
  password: string | null;

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

  /** 프로필 이미지 (POST /media 업로드 결과) */
  @Column({ nullable: true })
  profileMediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL", eager: true })
  @JoinColumn({ name: "profile_media_id" })
  profileMedia: Media | null;

  @Column({ type: "timestamptz", nullable: true })
  surveyCompletedAt: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  withdrawnAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
