import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "./pagination.dto";

export enum BoardSortOption {
  LATEST = "latest",
  POPULAR = "popular",
}

export class BoardQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "카테고리 ID 필터" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: BoardSortOption, default: BoardSortOption.LATEST })
  @IsOptional()
  @IsEnum(BoardSortOption)
  sort?: BoardSortOption = BoardSortOption.LATEST;
}
