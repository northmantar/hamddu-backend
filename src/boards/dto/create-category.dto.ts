import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ description: "카테고리 라벨", example: "자유게시판" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;
}
