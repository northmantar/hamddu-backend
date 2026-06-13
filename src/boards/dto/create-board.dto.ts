import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { BoardStatus } from "@enums/board.enum";

export class CreateBoardDto {
  @ApiProperty({ description: "카테고리 ID" })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: "게시글 제목", minLength: 1, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: "게시글 내용", minLength: 1, maxLength: 10000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  body: string;

  @ApiPropertyOptional({ enum: [BoardStatus.DRAFT, BoardStatus.PUBLISHED], default: BoardStatus.PUBLISHED })
  @IsOptional()
  @IsEnum([BoardStatus.DRAFT, BoardStatus.PUBLISHED])
  status?: BoardStatus.DRAFT | BoardStatus.PUBLISHED = BoardStatus.PUBLISHED;

  @ApiPropertyOptional({
    description: "첨부할 미디어 ID 목록 (순서대로 저장)",
    type: [String],
    example: ["media-uuid-1", "media-uuid-2"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  mediaIds?: string[];
}
