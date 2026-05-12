import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { BoardsService } from "./boards.service";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto } from "./dto/board-query.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { PaginationQueryDto, PaginationMeta } from "./dto/pagination.dto";
import {
  BoardListItemDto,
  BoardDetailDto,
  BoardLikeResponseDto,
} from "./dto/board-response.dto";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CommentResponseDto, CommentLikeResponseDto } from "./dto/comment-response.dto";

@ApiTags("boards")
@ApiBearerAuth()
@Controller("boards")
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly commentsService: CommentsService,
  ) {}

  // ==================== 게시판 API ====================

  @ApiOperation({ summary: "게시글 목록 조회" })
  @ApiResponse({ status: 200, description: "게시글 목록 반환" })
  @Get()
  async findAll(
    @Query() query: BoardQueryDto,
  ): Promise<{ data: BoardListItemDto[]; meta: PaginationMeta }> {
    const result = await this.boardsService.findAll(query);
    return {
      data: result.data.map(BoardListItemDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "게시판 카테고리 목록 조회" })
  @ApiResponse({ status: 200, description: "카테고리 목록 반환" })
  @Get("categories")
  async findCategories(): Promise<{ data: CategoryResponseDto[] }> {
    const categories = await this.boardsService.findAllCategories();
    return { data: categories.map(CategoryResponseDto.from) };
  }

  @ApiOperation({ summary: "게시글 상세 조회" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "게시글 상세 반환" })
  @ApiResponse({ status: 404, description: "게시글을 찾을 수 없음" })
  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<BoardDetailDto> {
    const board = await this.boardsService.findById(id);
    const isLiked = await this.boardsService.isLikedByUser(id, payload.sub);
    return BoardDetailDto.fromWithLike(board, isLiked);
  }

  @ApiOperation({ summary: "게시글 작성" })
  @ApiResponse({ status: 201, description: "게시글 생성 완료" })
  @ApiResponse({ status: 400, description: "유효하지 않은 요청" })
  @Post()
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateBoardDto,
  ): Promise<BoardDetailDto> {
    const board = await this.boardsService.create(payload.sub, dto);
    return BoardDetailDto.fromWithLike(board, false);
  }

  @ApiOperation({ summary: "게시글 수정" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "게시글 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "게시글을 찾을 수 없음" })
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateBoardDto,
  ): Promise<BoardDetailDto> {
    const board = await this.boardsService.update(id, payload.sub, dto);
    const isLiked = await this.boardsService.isLikedByUser(id, payload.sub);
    return BoardDetailDto.fromWithLike(board, isLiked);
  }

  @ApiOperation({ summary: "게시글 삭제" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 204, description: "게시글 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "게시글을 찾을 수 없음" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<void> {
    await this.boardsService.delete(id, payload.sub);
  }

  @ApiOperation({ summary: "게시글 좋아요" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "좋아요 완료" })
  @ApiResponse({ status: 409, description: "이미 좋아요한 게시글" })
  @Post(":id/like")
  async like(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<BoardLikeResponseDto> {
    const result = await this.boardsService.like(id, payload.sub);
    return {
      boardId: id,
      likeCount: result.likeCount,
      isLiked: true,
    };
  }

  @ApiOperation({ summary: "게시글 좋아요 취소" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "좋아요 취소 완료" })
  @ApiResponse({ status: 404, description: "좋아요 기록 없음" })
  @Delete(":id/like")
  async unlike(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<BoardLikeResponseDto> {
    const result = await this.boardsService.unlike(id, payload.sub);
    return {
      boardId: id,
      likeCount: result.likeCount,
      isLiked: false,
    };
  }

  // ==================== 댓글 API ====================

  @ApiOperation({ summary: "댓글 목록 조회 (스레드 형식)" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "댓글 목록 반환" })
  @Get(":boardId/comments")
  async findComments(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @CurrentUser() payload: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: CommentResponseDto[]; meta: PaginationMeta }> {
    return this.commentsService.findAll(boardId, payload.sub, query);
  }

  @ApiOperation({ summary: "댓글/대댓글 작성" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiResponse({ status: 201, description: "댓글 생성 완료" })
  @ApiResponse({ status: 400, description: "유효하지 않은 요청" })
  @ApiResponse({ status: 404, description: "게시글/부모댓글을 찾을 수 없음" })
  @Post(":boardId/comments")
  async createComment(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.create(boardId, payload.sub, dto);
    return CommentResponseDto.from(comment, false, []);
  }

  @ApiOperation({ summary: "댓글 수정" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 200, description: "댓글 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "댓글을 찾을 수 없음" })
  @Patch(":boardId/comments/:commentId")
  async updateComment(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.update(boardId, commentId, payload.sub, dto);
    const isLiked = await this.commentsService.isLikedByUser(commentId, payload.sub);
    return CommentResponseDto.from(comment, isLiked);
  }

  @ApiOperation({ summary: "댓글 삭제" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 204, description: "댓글 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "댓글을 찾을 수 없음" })
  @Delete(":boardId/comments/:commentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<void> {
    await this.commentsService.delete(boardId, commentId, payload.sub);
  }

  @ApiOperation({ summary: "댓글 좋아요" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 200, description: "좋아요 완료" })
  @ApiResponse({ status: 409, description: "이미 좋아요한 댓글" })
  @Post(":boardId/comments/:commentId/like")
  async likeComment(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<CommentLikeResponseDto> {
    const result = await this.commentsService.like(boardId, commentId, payload.sub);
    return {
      commentId,
      likeCount: result.likeCount,
      isLiked: true,
    };
  }

  @ApiOperation({ summary: "댓글 좋아요 취소" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 200, description: "좋아요 취소 완료" })
  @ApiResponse({ status: 404, description: "좋아요 기록 없음" })
  @Delete(":boardId/comments/:commentId/like")
  async unlikeComment(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<CommentLikeResponseDto> {
    const result = await this.commentsService.unlike(boardId, commentId, payload.sub);
    return {
      commentId,
      likeCount: result.likeCount,
      isLiked: false,
    };
  }
}
