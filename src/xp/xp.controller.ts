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
import { XpService } from "./xp.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { EarnXpDto } from "./dto/earn-xp.dto";
import { CreateXpLevelDto } from "./dto/create-level.dto";
import { UpdateXpLevelDto } from "./dto/update-level.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";
import {
  XpWalletResponseDto,
  XpTransactionResponseDto,
  XpEarnResponseDto,
  XpLevelPolicyResponseDto,
} from "./dto/xp-response.dto";

@ApiTags("xp")
@ApiBearerAuth()
@Controller("xp")
@UseGuards(JwtAuthGuard)
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @ApiOperation({ summary: "XP 지갑 조회" })
  @ApiResponse({ status: 200, description: "XP 지갑 정보 반환" })
  @Get("wallet")
  async getWallet(@CurrentUser() payload: JwtPayload): Promise<XpWalletResponseDto> {
    const { wallet, nextLevelPolicy } = await this.xpService.getWallet(payload.sub);
    return XpWalletResponseDto.from(wallet, nextLevelPolicy);
  }

  @ApiOperation({ summary: "XP 거래 내역 조회" })
  @ApiResponse({ status: 200, description: "XP 거래 내역 반환" })
  @Get("transactions")
  async getTransactions(
    @CurrentUser() payload: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: XpTransactionResponseDto[]; meta: PaginationMeta }> {
    const result = await this.xpService.getTransactions(payload.sub, query);
    return {
      data: result.data.map(XpTransactionResponseDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "XP 지급 (관리자/내부용)" })
  @ApiResponse({ status: 200, description: "XP 지급 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "유저를 찾을 수 없음" })
  @Post("earn")
  @UseGuards(AdminGuard)
  async earn(@Body() dto: EarnXpDto): Promise<XpEarnResponseDto> {
    const { transaction, newTotalXp, newLevel, leveledUp } = await this.xpService.earn(dto);
    return {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      newTotalXp,
      newLevel,
      leveledUp,
      createdAt: transaction.createdAt,
    };
  }

  @ApiOperation({ summary: "XP 레벨 정책 목록 조회" })
  @ApiResponse({ status: 200, description: "XP 레벨 정책 목록 반환" })
  @Get("levels")
  async getLevels(): Promise<{ data: XpLevelPolicyResponseDto[] }> {
    const levels = await this.xpService.getLevels();
    return { data: levels.map(XpLevelPolicyResponseDto.from) };
  }

  @ApiOperation({ summary: "XP 레벨 정책 생성 (관리자)" })
  @ApiResponse({ status: 201, description: "레벨 정책 생성 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post("levels")
  @UseGuards(AdminGuard)
  async createLevel(@Body() dto: CreateXpLevelDto): Promise<XpLevelPolicyResponseDto> {
    const policy = await this.xpService.createLevel(dto);
    return XpLevelPolicyResponseDto.from(policy);
  }

  @ApiOperation({ summary: "XP 레벨 정책 수정 (관리자)" })
  @ApiParam({ name: "id", description: "레벨 정책 ID" })
  @ApiResponse({ status: 200, description: "레벨 정책 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "정책을 찾을 수 없음" })
  @Patch("levels/:id")
  @UseGuards(AdminGuard)
  async updateLevel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateXpLevelDto,
  ): Promise<XpLevelPolicyResponseDto> {
    const policy = await this.xpService.updateLevel(id, dto);
    return XpLevelPolicyResponseDto.from(policy);
  }

  @ApiOperation({ summary: "XP 레벨 정책 삭제 (관리자)" })
  @ApiParam({ name: "id", description: "레벨 정책 ID" })
  @ApiResponse({ status: 204, description: "레벨 정책 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "정책을 찾을 수 없음" })
  @Delete("levels/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  async deleteLevel(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.xpService.deleteLevel(id);
  }
}
