import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class UpdateBoardDto {
  @ApiPropertyOptional({ description: "카테고리 ID" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: "게시글 제목", minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: "게시글 내용", minLength: 1, maxLength: 10000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body?: string;
}
