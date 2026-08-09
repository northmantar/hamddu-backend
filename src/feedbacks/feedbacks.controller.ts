import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FeedbacksService } from "./feedbacks.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackListItemDto, FeedbackResponseDto } from "./dto/feedback-response.dto";
import { PaginationMeta, PaginationQueryDto } from "../boards/dto/pagination.dto";

@ApiTags("feedbacks")
@ApiBearerAuth()
@Controller("feedbacks")
@UseGuards(JwtAuthGuard)
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @ApiOperation({ summary: "의견 보내기" })
  @ApiResponse({ status: 201, description: "의견 등록 완료", type: FeedbackResponseDto })
  @ApiResponse({ status: 400, description: "유효성 검사 실패" })
  @Post()
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const feedback = await this.feedbacksService.create(payload.sub, dto);
    return FeedbackResponseDto.from(feedback);
  }

  @ApiOperation({ summary: "의견 목록 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "의견 목록 반환 (최신순)" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get()
  @UseGuards(AdminGuard)
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: FeedbackListItemDto[]; meta: PaginationMeta }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, totalCount } = await this.feedbacksService.findAll(page, limit);

    return {
      data: data.map(FeedbackListItemDto.fromWithMember),
      meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    };
  }
}
