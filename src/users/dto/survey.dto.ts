import { IsEnum } from 'class-validator';
import { AgeRange } from '../entities/user.entity';

export class SurveyDto {
  @IsEnum(AgeRange)
  age: AgeRange;
}
