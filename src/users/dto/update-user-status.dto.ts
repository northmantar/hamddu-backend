import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserStatus } from "@enums/user.enum";

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, description: "유저 상태" })
  @IsEnum(UserStatus)
  status: UserStatus;
}
