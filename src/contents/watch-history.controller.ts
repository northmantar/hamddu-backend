import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { WatchHistoryService } from "./watch-history.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";
import { CreateWatchHistoryDto } from "./dto/create-watch-history.dto";
import {
  WatchHistoryListItemDto,
  WatchHistoryResponseDto,
} from "./dto/watch-history-response.dto";

@ApiTags("watch-history")
@ApiBearerAuth()
@Controller("watch-history")
@UseGuards(JwtAuthGuard)
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @ApiOperation({ summary: "시청 기록 목록 조회" })
  @ApiResponse({ status: 200, description: "시청 기록 목록 반환" })
  @Get()
  async findAll(
    @CurrentUser() payload: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: WatchHistoryListItemDto[]; meta: PaginationMeta }> {
    const result = await this.watchHistoryService.findAll(payload.sub, query);
    return {
      data: result.data.map(WatchHistoryListItemDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "시청 기록 저장/업데이트" })
  @ApiResponse({ status: 200, description: "시청 기록 저장 완료" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @Post()
  async createOrUpdate(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateWatchHistoryDto,
  ): Promise<WatchHistoryResponseDto> {
    const watchHistory = await this.watchHistoryService.createOrUpdate(payload.sub, dto);
    return WatchHistoryResponseDto.from(watchHistory);
  }
}
