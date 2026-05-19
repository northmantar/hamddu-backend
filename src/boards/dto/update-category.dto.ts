import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { BoardCategoryStatus } from "@enums/board.enum";

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: "카테고리 라벨", example: "자유게시판" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({
    description: "카테고리 상태",
    enum: BoardCategoryStatus,
    example: BoardCategoryStatus.ENABLED,
  })
  @IsOptional()
  @IsEnum(BoardCategoryStatus)
  status?: BoardCategoryStatus;
}
