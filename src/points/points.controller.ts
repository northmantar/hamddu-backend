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
import { PointsService } from "./points.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { EarnPointDto } from "./dto/earn-point.dto";
import { PointTransactionQueryDto } from "./dto/point-query.dto";
import { PaginationMeta } from "../boards/dto/pagination.dto";
import {
  PointWalletResponseDto,
  PointTransactionResponseDto,
  PointEarnResponseDto,
  PointPolicyResponseDto,
} from "./dto/point-response.dto";

@ApiTags("points")
@ApiBearerAuth()
@Controller("points")
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @ApiOperation({ summary: "포인트 지갑 조회" })
  @ApiResponse({ status: 200, description: "포인트 지갑 정보 반환" })
  @Get("wallet")
  async getWallet(@CurrentUser() payload: JwtPayload): Promise<PointWalletResponseDto> {
    const wallet = await this.pointsService.getWallet(payload.sub);
    return PointWalletResponseDto.from(wallet);
  }

  @ApiOperation({ summary: "포인트 거래 내역 조회" })
  @ApiResponse({ status: 200, description: "포인트 거래 내역 반환" })
  @Get("transactions")
  async getTransactions(
    @CurrentUser() payload: JwtPayload,
    @Query() query: PointTransactionQueryDto,
  ): Promise<{ data: PointTransactionResponseDto[]; meta: PaginationMeta }> {
    const result = await this.pointsService.getTransactions(payload.sub, query);
    return {
      data: result.data.map(PointTransactionResponseDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "포인트 지급 (관리자/내부용)" })
  @ApiResponse({ status: 200, description: "포인트 지급 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "유저 또는 정책을 찾을 수 없음" })
  @Post("earn")
  @UseGuards(AdminGuard)
  async earn(@Body() dto: EarnPointDto): Promise<PointEarnResponseDto> {
    const { transaction, newBalance } = await this.pointsService.earn(dto);
    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      description: transaction.description,
      newBalance,
      createdAt: transaction.createdAt,
    };
  }

  @ApiOperation({ summary: "포인트 정책 목록 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "포인트 정책 목록 반환" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Get("policies")
  @UseGuards(AdminGuard)
  async getPolicies(): Promise<{ data: PointPolicyResponseDto[] }> {
    const policies = await this.pointsService.getPolicies();
    return { data: policies.map(PointPolicyResponseDto.from) };
  }
}
