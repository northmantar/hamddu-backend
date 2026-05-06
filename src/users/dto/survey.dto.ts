import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  AgeRange,
  UserGender,
  UserInterests,
  UserAbility,
} from "../../enums/user.enum";

export class SurveyDto {
  @ApiProperty({ enum: AgeRange, description: '연령대' })
  @IsEnum(AgeRange)
  age: AgeRange;

  @ApiProperty({ enum: UserGender, description: '성별' })
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiProperty({ enum: UserInterests, description: '관심 분야' })
  @IsEnum(UserInterests)
  interests: UserInterests;

  @ApiProperty({ enum: UserAbility, description: '실력 수준' })
  @IsEnum(UserAbility)
  ability: UserAbility;
}
