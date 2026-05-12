import { ApiProperty } from "@nestjs/swagger";
import { BoardCategoryStatus } from "@enums/board.enum";
import { BoardCategory } from "@entities/board-category.entity";

export class CategoryResponseDto {
  @ApiProperty({ example: "category-uuid-1" })
  id: string;

  @ApiProperty({ example: "자유게시판" })
  label: string;

  @ApiProperty({ enum: BoardCategoryStatus })
  status: BoardCategoryStatus;

  static from(category: BoardCategory): CategoryResponseDto {
    return {
      id: category.id,
      label: category.label,
      status: category.status,
    };
  }
}
