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
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { NotificationsService } from "./notifications.service";
import { LEVEL_UP_TEMPLATE_KEY } from "./constants";
import {
  CreateCampaignDto,
  RegisterDeviceTokenDto,
  UpdateCampaignDto,
  UpdateTemplateDto,
} from "./dto/notification.dto";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // ───── 디바이스 토큰 (앱) ─────

  @ApiOperation({ summary: "FCM 디바이스 토큰 등록" })
  @Post("device-tokens")
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<void> {
    await this.service.registerDeviceToken(user.sub, dto.token, dto.platform);
  }

  @ApiOperation({ summary: "FCM 디바이스 토큰 해제" })
  @Delete("device-tokens/:token")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(@Param("token") token: string): Promise<void> {
    await this.service.removeDeviceToken(token);
  }

  // ───── 레벨업 템플릿 (어드민) ─────

  @ApiOperation({ summary: "레벨업 알림 템플릿 조회" })
  @Get("templates/level-up")
  @UseGuards(AdminGuard)
  getLevelUpTemplate() {
    return this.service.getTemplate(LEVEL_UP_TEMPLATE_KEY);
  }

  @ApiOperation({ summary: "레벨업 알림 템플릿 수정" })
  @Patch("templates/level-up")
  @UseGuards(AdminGuard)
  updateLevelUpTemplate(@Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(LEVEL_UP_TEMPLATE_KEY, dto);
  }

  // ───── 공지/배치 캠페인 (어드민) ─────

  @ApiOperation({ summary: "알림 캠페인 목록" })
  @Get("campaigns")
  @UseGuards(AdminGuard)
  listCampaigns() {
    return this.service.listCampaigns();
  }

  @ApiOperation({ summary: "알림 캠페인 생성(공지/배치)" })
  @Post("campaigns")
  @UseGuards(AdminGuard)
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(dto);
  }

  @ApiOperation({ summary: "알림 캠페인 수정" })
  @Patch("campaigns/:id")
  @UseGuards(AdminGuard)
  updateCampaign(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.service.updateCampaign(id, dto);
  }

  @ApiOperation({ summary: "배치 알림 일시정지" })
  @Post("campaigns/:id/pause")
  @UseGuards(AdminGuard)
  pauseCampaign(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.pauseCampaign(id);
  }

  @ApiOperation({ summary: "배치 알림 재개" })
  @Post("campaigns/:id/resume")
  @UseGuards(AdminGuard)
  resumeCampaign(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.resumeCampaign(id);
  }

  @ApiOperation({ summary: "알림 캠페인 삭제(취소)" })
  @Delete("campaigns/:id")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCampaign(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.service.deleteCampaign(id);
  }
}
