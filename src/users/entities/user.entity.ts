import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
}

export enum UserType {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum Platform {
  NAVER = 'naver',
  GOOGLE = 'google',
}

export enum AgeRange {
  AGE_1518  = '1518',
  AGE_1924  = '1924',
  AGE_2529  = '2529',
  AGE_3034  = '3034',
  AGE_3539  = '3539',
  AGE_4049  = '4049',
  OVER_50   = '50+',
}

@Entity('users')
@Unique(['platform', 'platformUserId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserType, default: UserType.MEMBER })
  type: UserType;

  @Column({ nullable: true })
  platformUserId: string | null;

  @Column({ type: 'enum', enum: Platform, nullable: true })
  platform: Platform | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  name: string | null;

  @Column({ unique: true, nullable: true, length: 30 })
  nickname: string | null;

  @Column({ type: 'enum', enum: AgeRange, nullable: true })
  age: AgeRange | null;

  @Column({ type: 'timestamptz', nullable: true })
  surveyCompletedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawnAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
