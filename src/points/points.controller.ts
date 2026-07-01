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
import { PointsService } from "./points.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { EarnPointDto } from "./dto/earn-point.dto";
import { CreatePointPolicyDto } from "./dto/create-policy.dto";
import { UpdatePointPolicyDto } from "./dto/update-policy.dto";
import { PointTransactionQueryDto } from "./dto/point-query.dto";
import { CreatePointActionTypeDto, UpdatePointActionTypeDto } from "./dto/action-type.dto";
import { PaginationMeta } from "../boards/dto/pagination.dto";
import {
  PointWalletResponseDto,
  PointTransactionResponseDto,
  PointEarnResponseDto,
  PointPolicyResponseDto,
  PointActionTypeResponseDto,
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

  @ApiOperation({ summary: "포인트 정책 생성 (관리자)" })
  @ApiResponse({ status: 201, description: "정책 생성 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post("policies")
  @UseGuards(AdminGuard)
  async createPolicy(@Body() dto: CreatePointPolicyDto): Promise<PointPolicyResponseDto> {
    const policy = await this.pointsService.createPolicy(dto);
    return PointPolicyResponseDto.from(policy);
  }

  @ApiOperation({ summary: "포인트 정책 수정 (관리자)" })
  @ApiParam({ name: "id", description: "정책 ID" })
  @ApiResponse({ status: 200, description: "정책 수정 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "정책을 찾을 수 없음" })
  @Patch("policies/:id")
  @UseGuards(AdminGuard)
  async updatePolicy(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePointPolicyDto,
  ): Promise<PointPolicyResponseDto> {
    const policy = await this.pointsService.updatePolicy(id, dto);
    return PointPolicyResponseDto.from(policy);
  }

  @ApiOperation({ summary: "포인트 정책 삭제 (관리자)" })
  @ApiParam({ name: "id", description: "정책 ID" })
  @ApiResponse({ status: 204, description: "정책 삭제 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 404, description: "정책을 찾을 수 없음" })
  @Delete("policies/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  async deletePolicy(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.pointsService.deletePolicy(id);
  }

  @ApiOperation({ summary: "포인트 액션 타입 목록 조회" })
  @ApiResponse({ status: 200, description: "액션 타입 목록 반환" })
  @Get("action-types")
  async getActionTypes(): Promise<{ data: PointActionTypeResponseDto[] }> {
    const actionTypes = await this.pointsService.getActionTypes();
    return { data: actionTypes.map(PointActionTypeResponseDto.from) };
  }

  @ApiOperation({ summary: "계측된 보상 이벤트 레지스트리 조회 (액션 타입 생성 시 선택지)" })
  @ApiResponse({ status: 200, description: "보상 이벤트 (refType, refAction) 목록 반환" })
  @Get("reward-events")
  getRewardEvents(): { data: { refType: string; refAction: string }[] } {
    return { data: this.pointsService.getRewardEvents().map((e) => ({ ...e })) };
  }

  @ApiOperation({ summary: "포인트 액션 타입 생성 (관리자)" })
  @ApiResponse({ status: 201, description: "액션 타입 생성 완료" })
  @ApiResponse({ status: 409, description: "이미 존재하는 액션 코드" })
  @Post("action-types")
  @UseGuards(AdminGuard)
  async createActionType(
    @Body() dto: CreatePointActionTypeDto,
  ): Promise<PointActionTypeResponseDto> {
    const at = await this.pointsService.createActionType(dto);
    return PointActionTypeResponseDto.from(at);
  }

  @ApiOperation({ summary: "포인트 액션 타입 수정 (관리자)" })
  @ApiParam({ name: "code", description: "액션 코드" })
  @ApiResponse({ status: 200, description: "액션 타입 수정 완료" })
  @ApiResponse({ status: 404, description: "액션 타입을 찾을 수 없음" })
  @Patch("action-types/:code")
  @UseGuards(AdminGuard)
  async updateActionType(
    @Param("code") code: string,
    @Body() dto: UpdatePointActionTypeDto,
  ): Promise<PointActionTypeResponseDto> {
    const at = await this.pointsService.updateActionType(code, dto);
    return PointActionTypeResponseDto.from(at);
  }

  @ApiOperation({ summary: "포인트 액션 타입 삭제 (관리자)" })
  @ApiParam({ name: "code", description: "액션 코드" })
  @ApiResponse({ status: 204, description: "액션 타입 삭제 완료" })
  @ApiResponse({ status: 409, description: "사용 중인 정책이 있어 삭제 불가" })
  @Delete("action-types/:code")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  async deleteActionType(@Param("code") code: string): Promise<void> {
    await this.pointsService.deleteActionType(code);
  }
}
