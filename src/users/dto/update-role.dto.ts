import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserType } from "@enums/user.enum";

export class UpdateRoleDto {
  @ApiProperty({
    description: "변경할 역할",
    enum: UserType,
    example: UserType.ADMIN,
  })
  @IsEnum(UserType)
  type: UserType;
}
