import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { UserInterests } from "@enums/user.enum";

export class TutorialQueryDto {
  @ApiProperty({ enum: UserInterests, description: "관심사 (필수)" })
  @IsEnum(UserInterests)
  @IsNotEmpty()
  interests: UserInterests;
}
