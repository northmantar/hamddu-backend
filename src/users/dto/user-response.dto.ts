import {
  AgeRange,
  Platform,
  UserStatus,
  UserType,
  UserGender,
  UserInterests,
  UserAbility,
} from "@enums/user.enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { User } from "@entities/user.entity";

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: UserType })
  type: UserType;

  @ApiProperty({ enum: Platform, nullable: true })
  platform: Platform | null;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '홍길동', nullable: true })
  name: string | null;

  @ApiProperty({ example: '실뭉치장인', nullable: true })
  nickname: string | null;

  @ApiProperty({ enum: AgeRange, nullable: true })
  age: AgeRange | null;

  @ApiProperty({ enum: UserGender, nullable: true })
  gender: UserGender | null;

  @ApiProperty({ enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @ApiProperty({ enum: UserAbility, nullable: true })
  ability: UserAbility | null;

  @ApiProperty({ example: true })
  surveyCompleted: boolean;

  @ApiProperty({ example: '2026-04-09T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: 1200, description: '서비스 회원 전용: 누적 XP' })
  xp?: number;

  @ApiPropertyOptional({ example: 500, description: '서비스 회원 전용: 포인트 잔액' })
  points?: number;

  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      status: user.status,
      type: user.type,
      platform: user.platform,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      age: user.age,
      gender: user.gender,
      interests: user.interests,
      ability: user.ability,
      surveyCompleted: user.surveyCompletedAt !== null,
      createdAt: user.createdAt,
    };
  }
}
