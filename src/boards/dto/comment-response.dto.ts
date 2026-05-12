import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BoardComment } from "@entities/board-comment.entity";
import { AuthorDto } from "./board-response.dto";

export class CommentResponseDto {
  @ApiProperty({ example: "comment-uuid" })
  id: string;

  @ApiProperty({ example: "좋은 정보 감사합니다!" })
  body: string;

  @ApiProperty({ example: 0 })
  depth: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 5 })
  likeCount: number;

  @ApiProperty({ example: false })
  isLiked: boolean;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ type: [CommentResponseDto], default: [] })
  children: CommentResponseDto[];

  @ApiProperty({ example: "2026-04-09T13:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-04-09T13:00:00.000Z" })
  updatedAt: Date;

  static from(comment: BoardComment, isLiked: boolean, children: CommentResponseDto[] = []): CommentResponseDto {
    return {
      id: comment.id,
      body: comment.deletedAt ? "삭제된 댓글입니다." : comment.body,
      depth: comment.depth,
      parentId: comment.parentId,
      likeCount: comment.likeCount,
      isLiked,
      author: {
        id: comment.member.id,
        nickname: comment.member.nickname ?? "",
      },
      children,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}

export class CommentLikeResponseDto {
  @ApiProperty({ example: "comment-uuid" })
  commentId: string;

  @ApiProperty({ example: 6 })
  likeCount: number;

  @ApiProperty({ example: true })
  isLiked: boolean;
}
