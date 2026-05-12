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
import { ContentsService } from "./contents.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ContentQueryDto } from "./dto/content-query.dto";
import { CreateContentDto } from "./dto/create-content.dto";
import { UpdateContentDto } from "./dto/update-content.dto";
import { ContentListItemDto, ContentDetailDto } from "./dto/content-response.dto";
import { PaginationMeta } from "../boards/dto/pagination.dto";

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

  @ApiOperation({ summary: "콘텐츠 상세 조회" })
  @ApiParam({ name: "id", description: "콘텐츠 ID" })
  @ApiResponse({ status: 200, description: "콘텐츠 상세 반환 (튜토리얼인 경우 시청 기록 포함)" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() payload: JwtPayload,
  ): Promise<ContentDetailDto> {
    const content = await this.contentsService.findById(id);
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
