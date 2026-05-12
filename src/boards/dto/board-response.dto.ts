import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BoardStatus } from "@enums/board.enum";
import { Board } from "@entities/board.entity";

export class AuthorDto {
  @ApiProperty({ example: "author-uuid" })
  id: string;

  @ApiProperty({ example: "실뭉치장인" })
  nickname: string;
}

export class CategoryDto {
  @ApiProperty({ example: "category-uuid" })
  id: string;

  @ApiProperty({ example: "질문/답변" })
  label: string;
}

export class BoardListItemDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "코바늘 시작하기 질문이요!" })
  title: string;

  @ApiProperty({ example: "안녕하세요, 코바늘 입문자입니다..." })
  body: string;

  @ApiProperty({ example: 12 })
  likeCount: number;

  @ApiProperty({ type: CategoryDto })
  category: CategoryDto;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ example: "2026-04-09T12:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T12:00:00.000Z" })
  updatedAt: Date;

  static from(board: Board): BoardListItemDto {
    return {
      id: board.id,
      title: board.title,
      body: board.body,
      likeCount: board.likeCount,
      category: {
        id: board.category.id,
        label: board.category.label,
      },
      author: {
        id: board.member.id,
        nickname: board.member.nickname ?? "",
      },
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }
}

export class BoardDetailDto extends BoardListItemDto {
  @ApiProperty({ enum: BoardStatus })
  status: BoardStatus;

  @ApiPropertyOptional({ example: false })
  isLiked?: boolean;

  static fromWithLike(board: Board, isLiked: boolean): BoardDetailDto {
    return {
      ...BoardListItemDto.from(board),
      status: board.status,
      isLiked,
    };
  }
}

export class BoardLikeResponseDto {
  @ApiProperty({ example: "board-uuid" })
  boardId: string;

  @ApiProperty({ example: 13 })
  likeCount: number;

  @ApiProperty({ example: true })
  isLiked: boolean;
}
