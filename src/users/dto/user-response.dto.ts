import {
  AgeRange,
  Platform,
  UserStatus,
  UserType,
  UserGender,
  UserInterests,
  UserAbility,
} from "@enums/user.enum";
import { User } from "@entities/user.entity";

export class UserResponseDto {
  id: string;
  status: UserStatus;
  type: UserType;
  platform: Platform | null;
  email: string | null;
  name: string | null;
  nickname: string | null;
  age: AgeRange | null;
  gender: UserGender | null;
  interests: UserInterests | null;
  ability: UserAbility | null;
  surveyCompleted: boolean;
  createdAt: Date;

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
