import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FeedbacksService } from "./feedbacks.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackResponseDto } from "./dto/feedback-response.dto";

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
}
