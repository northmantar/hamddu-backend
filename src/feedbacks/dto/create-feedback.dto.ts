import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateFeedbackDto {
  @ApiProperty({ description: "의견 내용", example: "튜토리얼에 자막이 있으면 좋겠어요." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
