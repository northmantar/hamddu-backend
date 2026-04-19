import { IsEnum } from "class-validator";
import {
  AgeRange,
  UserGender,
  UserInterests,
  UserAbility,
} from "../../enums/user.enum";

export class SurveyDto {
  @IsEnum(AgeRange)
  age: AgeRange;

  @IsEnum(UserGender)
  gender: UserGender;

  @IsEnum(UserInterests)
  interests: UserInterests;

  @IsEnum(UserAbility)
  ability: UserAbility;
}
