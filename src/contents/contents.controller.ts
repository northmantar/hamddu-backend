import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
import { ContentsService } from "./contents.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ContentQueryDto } from "./dto/content-query.dto";
import { CreateContentDto } from "./dto/create-content.dto";
import { UpdateContentDto } from "./dto/update-content.dto";
import { TutorialQueryDto } from "./dto/tutorial-query.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { BulkReorderDto } from "./dto/bulk-reorder.dto";
import { ContentListItemDto, ContentDetailDto } from "./dto/content-response.dto";
import { PaginationMeta } from "../boards/dto/pagination.dto";
import { AdminGuard } from "../common/guards/admin.guard";
import { UserInterests } from "@enums/user.enum";

@ApiTags("contents")
@ApiBearerAuth()
@Controller("contents")
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @ApiOperation({ summary: "콘텐츠 목록 조회" })
  @ApiResponse({ status: 200, description: "콘텐츠 목록 반환" })
  @Get()
  async findAll(
    @Query() query: ContentQueryDto,
  ): Promise<{ data: ContentListItemDto[]; meta: PaginationMeta }> {
    const result = await this.contentsService.findAll(query);
    return {
      data: result.data.map(ContentListItemDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "튜토리얼 콘텐츠 목록 조회 (순서별)" })
  @ApiResponse({ status: 200, description: "튜토리얼 콘텐츠 목록 반환 (sortOrder 오름차순)" })
  @Get("tutorials")
  async findTutorials(@Query() query: TutorialQueryDto): Promise<ContentListItemDto[]> {
    const contents = await this.contentsService.findTutorials(query);
    return contents.map(ContentListItemDto.from);
  }

  @ApiOperation({ summary: "콘텐츠 상세 조회" })
  @ApiParam({ name: "id", description: "콘텐츠 ID" })
  @ApiResponse({ status: 200, description: "콘텐츠 상세 반환 (튜토리얼인 경우 시청 기록 포함)" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<ContentDetailDto> {
    const content = await this.contentsService.findActiveContent(id);
    const watchHistory = await this.contentsService.findWatchHistory(id, payload.sub);
    const challengeCompleted = await this.contentsService.isChallengeCompleted(id, payload.sub);

    return ContentDetailDto.fromWithDetails(content, watchHistory, challengeCompleted);
  }

  @ApiOperation({ summary: "콘텐츠 등록 (관리자)" })
  @ApiResponse({ status: 201, description: "콘텐츠 생성 완료" })
  @ApiResponse({ status: 400, description: "유효하지 않은 요청" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post()
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateContentDto,
  ): Promise<ContentDetailDto> {
    const content = await this.contentsService.create(payload.sub, dto);
    return ContentDetailDto.fromWithDetails(content, null, false);
  }

  @ApiOperation({ summary: "콘텐츠 수정 (관리자)" })
  @ApiParam({ name: "id", description: "콘텐츠 ID" })
  @ApiResponse({ status: 200, description: "콘텐츠 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateContentDto,
  ): Promise<ContentDetailDto> {
    const content = await this.contentsService.update(id, payload.sub, dto);
    const watchHistory = await this.contentsService.findWatchHistory(id, payload.sub);
    const challengeCompleted = await this.contentsService.isChallengeCompleted(id, payload.sub);

    return ContentDetailDto.fromWithDetails(content, watchHistory, challengeCompleted);
  }

  @ApiOperation({ summary: "튜토리얼 순서 일괄 변경 (관리자)" })
  @ApiParam({ name: "interests", enum: UserInterests, description: "관심사" })
  @ApiResponse({ status: 204, description: "순서 변경 완료" })
  @ApiResponse({ status: 400, description: "ID 개수 불일치 / 유효하지 않은 ID / 중복 ID" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Patch("tutorials/:interests/order")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderTutorials(
    @Param("interests", new ParseEnumPipe(UserInterests)) interests: UserInterests,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: BulkReorderDto,
  ): Promise<void> {
    await this.contentsService.reorderTutorials(payload.sub, interests, dto);
  }

  @ApiOperation({ summary: "콘텐츠 순서 변경 (관리자)" })
  @ApiParam({ name: "id", description: "콘텐츠 ID" })
  @ApiResponse({ status: 200, description: "콘텐츠 순서 변경 완료" })
  @ApiResponse({ status: 400, description: "순서 변경 불가 (interests 미지정)" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Patch(":id/order")
  async updateOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateOrderDto,
  ): Promise<ContentDetailDto> {
    const content = await this.contentsService.updateSortOrder(id, payload.sub, dto);
    const watchHistory = await this.contentsService.findWatchHistory(id, payload.sub);
    const challengeCompleted = await this.contentsService.isChallengeCompleted(id, payload.sub);

    return ContentDetailDto.fromWithDetails(content, watchHistory, challengeCompleted);
  }

  @ApiOperation({ summary: "콘텐츠 삭제 (관리자)" })
  @ApiParam({ name: "id", description: "콘텐츠 ID" })
  @ApiResponse({ status: 204, description: "콘텐츠 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<void> {
    await this.contentsService.delete(id, payload.sub);
  }
}
