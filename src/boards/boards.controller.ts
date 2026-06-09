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
import { ReportsService } from "./reports.service";
import { CommentReportsService } from "./comment-reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto } from "./dto/board-query.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { ReportQueryDto } from "./dto/report-query.dto";
import { PaginationQueryDto, PaginationMeta } from "./dto/pagination.dto";
import {
  BoardListItemDto,
  BoardDetailDto,
  BoardLikeResponseDto,
} from "./dto/board-response.dto";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CommentResponseDto, CommentLikeResponseDto } from "./dto/comment-response.dto";
import {
  CreateReportResponseDto,
  ReportDetailDto,
} from "./dto/report-response.dto";
import {
  CreateCommentReportResponseDto,
  CommentReportDetailDto,
} from "./dto/comment-report-response.dto";

@ApiTags("boards")
@ApiBearerAuth()
@Controller("boards")
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly commentsService: CommentsService,
    private readonly reportsService: ReportsService,
    private readonly commentReportsService: CommentReportsService,
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

  @ApiOperation({ summary: "게시글 신고" })
  @ApiParam({ name: "id", description: "게시글 ID" })
  @ApiResponse({ status: 201, description: "신고 접수 완료" })
  @ApiResponse({ status: 403, description: "본인 게시글 신고 불가" })
  @ApiResponse({ status: 404, description: "게시글을 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 신고한 게시글" })
  @Post(":id/report")
  async report(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    const report = await this.reportsService.create(id, payload.sub, dto);
    return {
      id: report.id,
      boardId: id,
      message: "신고가 접수되었습니다.",
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

  @ApiOperation({ summary: "댓글 신고" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 201, description: "신고 접수 완료" })
  @ApiResponse({ status: 403, description: "본인 댓글 신고 불가" })
  @ApiResponse({ status: 404, description: "댓글을 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 신고한 댓글" })
  @Post(":boardId/comments/:commentId/report")
  async reportComment(
    @Param("boardId", ParseUUIDPipe) _boardId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateReportDto,
  ): Promise<CreateCommentReportResponseDto> {
    const report = await this.commentReportsService.create(commentId, payload.sub, dto);
    return {
      id: report.id,
      commentId,
      message: "신고가 접수되었습니다.",
    };
  }

  // ==================== 카테고리 관리 API (관리자) ====================

  @ApiOperation({ summary: "카테고리 생성 (관리자)" })
  @ApiResponse({ status: 201, description: "카테고리 생성 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post("categories")
  @UseGuards(AdminGuard)
  async createCategory(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.boardsService.createCategory(dto);
    return CategoryResponseDto.from(category);
  }

  @ApiOperation({ summary: "카테고리 수정 (관리자)" })
  @ApiParam({ name: "categoryId", description: "카테고리 ID" })
  @ApiResponse({ status: 200, description: "카테고리 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "카테고리를 찾을 수 없음" })
  @Patch("categories/:categoryId")
  @UseGuards(AdminGuard)
  async updateCategory(
    @Param("categoryId", ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.boardsService.updateCategory(categoryId, dto);
    return CategoryResponseDto.from(category);
  }

  @ApiOperation({ summary: "카테고리 삭제 (관리자)" })
  @ApiParam({ name: "categoryId", description: "카테고리 ID" })
  @ApiResponse({ status: 204, description: "카테고리 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "카테고리를 찾을 수 없음" })
  @Delete("categories/:categoryId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  async deleteCategory(@Param("categoryId", ParseUUIDPipe) categoryId: string): Promise<void> {
    await this.boardsService.deleteCategory(categoryId);
  }

  // ==================== 신고 관리 API (관리자) ====================

  @ApiOperation({ summary: "전체 신고 목록 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "신고 목록 반환" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get("admin/reports")
  @UseGuards(AdminGuard)
  async findAllReports(
    @Query() query: ReportQueryDto,
  ): Promise<{ data: ReportDetailDto[]; meta: PaginationMeta }> {
    const result = await this.reportsService.findAll(query);
    return {
      data: result.data.map(ReportDetailDto.fromWithDetails),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "특정 게시글 신고 목록 조회 (관리자)" })
  @ApiParam({ name: "boardId", description: "게시글 ID" })
  @ApiResponse({ status: 200, description: "신고 목록 반환" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get("admin/:boardId/reports")
  @UseGuards(AdminGuard)
  async findReportsByBoard(
    @Param("boardId", ParseUUIDPipe) boardId: string,
    @Query() query: ReportQueryDto,
  ): Promise<{ data: ReportDetailDto[]; meta: PaginationMeta }> {
    const result = await this.reportsService.findByBoardId(boardId, query);
    return {
      data: result.data.map(ReportDetailDto.fromWithDetails),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "신고 처리 (관리자)" })
  @ApiParam({ name: "reportId", description: "신고 ID" })
  @ApiResponse({ status: 200, description: "신고 처리 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "신고를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 처리된 신고" })
  @Patch("admin/reports/:reportId")
  @UseGuards(AdminGuard)
  async updateReport(
    @Param("reportId", ParseUUIDPipe) reportId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateReportDto,
  ): Promise<ReportDetailDto> {
    const report = await this.reportsService.update(reportId, payload.sub, dto);
    return ReportDetailDto.fromWithDetails(report);
  }

  // ==================== 댓글 신고 관리 API (관리자) ====================

  @ApiOperation({ summary: "전체 댓글 신고 목록 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "댓글 신고 목록 반환" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get("admin/comment-reports")
  @UseGuards(AdminGuard)
  async findAllCommentReports(
    @Query() query: ReportQueryDto,
  ): Promise<{ data: CommentReportDetailDto[]; meta: PaginationMeta }> {
    const result = await this.commentReportsService.findAll(query);
    return {
      data: result.data.map(CommentReportDetailDto.fromWithDetails),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "특정 댓글 신고 목록 조회 (관리자)" })
  @ApiParam({ name: "commentId", description: "댓글 ID" })
  @ApiResponse({ status: 200, description: "댓글 신고 목록 반환" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get("admin/comments/:commentId/reports")
  @UseGuards(AdminGuard)
  async findReportsByComment(
    @Param("commentId", ParseUUIDPipe) commentId: string,
    @Query() query: ReportQueryDto,
  ): Promise<{ data: CommentReportDetailDto[]; meta: PaginationMeta }> {
    const result = await this.commentReportsService.findByCommentId(commentId, query);
    return {
      data: result.data.map(CommentReportDetailDto.fromWithDetails),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "댓글 신고 처리 (관리자)" })
  @ApiParam({ name: "reportId", description: "댓글 신고 ID" })
  @ApiResponse({ status: 200, description: "댓글 신고 처리 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "신고를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 처리된 신고" })
  @Patch("admin/comment-reports/:reportId")
  @UseGuards(AdminGuard)
  async updateCommentReport(
    @Param("reportId", ParseUUIDPipe) reportId: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateReportDto,
  ): Promise<CommentReportDetailDto> {
    const report = await this.commentReportsService.update(reportId, payload.sub, dto);
    return CommentReportDetailDto.fromWithDetails(report);
  }
}
