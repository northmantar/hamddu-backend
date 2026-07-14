import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { In, Repository } from "typeorm";
import { DeviceToken } from "@entities/device-token.entity";
import { NotificationCampaign } from "@entities/notification-campaign.entity";
import { NotificationTemplate } from "@entities/notification-template.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { CampaignStatus, CampaignType } from "../enums/notification.enum";
import { FirebaseService } from "./firebase.service";
import {
  LEVEL_UP_TEMPLATE_KEY,
  NOTIFICATION_QUEUE,
  TOPIC_ALL,
} from "./constants";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateTemplateDto,
} from "./dto/notification.dto";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly tokenRepo: Repository<DeviceToken>,
    @InjectRepository(NotificationCampaign)
    private readonly campaignRepo: Repository<NotificationCampaign>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(XpLevelPolicy)
    private readonly levelRepo: Repository<XpLevelPolicy>,
    private readonly firebase: FirebaseService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
  ) {}

  // ───────────────────────── 디바이스 토큰 ─────────────────────────

  async registerDeviceToken(userId: string, token: string, platform?: string): Promise<void> {
    const existing = await this.tokenRepo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform ?? existing.platform;
      await this.tokenRepo.save(existing);
    } else {
      await this.tokenRepo.save(
        this.tokenRepo.create({ userId, token, platform: platform ?? null }),
      );
    }
    // 전체 브로드캐스트 토픽 구독 (실패해도 등록 자체는 성공 처리)
    try {
      await this.firebase.subscribeToTopic(token, TOPIC_ALL);
    } catch (e) {
      this.logger.warn(`토픽 구독 실패(token=${token.slice(0, 12)}…): ${(e as Error).message}`);
    }
  }

  async removeDeviceToken(token: string): Promise<void> {
    await this.tokenRepo.delete({ token });
  }

  // ───────────────────────── 발송 (프로세서에서 호출) ─────────────────────────

  /** 특정 유저에게 발송. 무효 토큰은 즉시 정리. */
  async sendToUser(userId: string, notification: { title: string; body: string }): Promise<void> {
    const rows = await this.tokenRepo.find({ where: { userId } });
    if (rows.length === 0) return;
    const tokens = rows.map((r) => r.token);
    const { invalidTokens } = await this.firebase.sendToTokens(tokens, notification);
    if (invalidTokens.length > 0) {
      await this.tokenRepo.delete({ token: In(invalidTokens) });
    }
  }

  /** 레벨업 알림을 큐에 적재(fire-and-forget). XP 트랜잭션과 발송을 분리. */
  async enqueueLevelUp(userId: string, level: number): Promise<void> {
    await this.queue.add("level_up", { userId, level }, { removeOnComplete: true });
  }

  /** 레벨업 이벤트 알림. 템플릿(level_up)이 활성일 때만 발송. */
  async sendLevelUp(userId: string, level: number): Promise<void> {
    const tpl = await this.templateRepo.findOne({ where: { key: LEVEL_UP_TEMPLATE_KEY } });
    if (!tpl || !tpl.isActive) return;
    const policy = await this.levelRepo.findOne({ where: { level } });
    const label = policy?.label ?? "";
    const render = (s: string) =>
      s.replace(/\{level\}/g, String(level)).replace(/\{label\}/g, label);
    await this.sendToUser(userId, { title: render(tpl.title), body: render(tpl.body) });
  }

  /** 캠페인 실행(공지/배치). 취소/정지 상태면 스킵. 공지는 발송 후 SENT 처리. */
  async runCampaign(campaignId: string): Promise<void> {
    const c = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!c || c.status === CampaignStatus.CANCELED || c.status === CampaignStatus.PAUSED) return;
    await this.firebase.sendToTopic(TOPIC_ALL, { title: c.title, body: c.body });
    if (c.type === CampaignType.ANNOUNCEMENT) {
      c.status = CampaignStatus.SENT;
      await this.campaignRepo.save(c);
    }
  }

  // ───────────────────────── 템플릿 (어드민) ─────────────────────────

  getTemplate(key: string): Promise<NotificationTemplate | null> {
    return this.templateRepo.findOne({ where: { key } });
  }

  async updateTemplate(key: string, dto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const tpl = await this.templateRepo.findOne({ where: { key } });
    if (!tpl) throw new NotFoundException("템플릿을 찾을 수 없습니다.");
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  // ───────────────────────── 캠페인 (어드민) ─────────────────────────

  listCampaigns(): Promise<NotificationCampaign[]> {
    return this.campaignRepo.find({ order: { createdAt: "DESC" } });
  }

  async createCampaign(dto: CreateCampaignDto): Promise<NotificationCampaign> {
    if (dto.type === CampaignType.ANNOUNCEMENT && !dto.scheduledAt) {
      throw new BadRequestException("공지 알림은 scheduledAt이 필요합니다.");
    }
    if (dto.type === CampaignType.BATCH && !dto.cron) {
      throw new BadRequestException("배치 알림은 cron이 필요합니다.");
    }
    const c = await this.campaignRepo.save(
      this.campaignRepo.create({
        type: dto.type,
        title: dto.title,
        body: dto.body,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        cron: dto.cron ?? null,
        status:
          dto.type === CampaignType.ANNOUNCEMENT
            ? CampaignStatus.SCHEDULED
            : CampaignStatus.ACTIVE,
      }),
    );
    await this.scheduleCampaign(c);
    return c;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<NotificationCampaign> {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException("캠페인을 찾을 수 없습니다.");
    if (dto.title !== undefined) c.title = dto.title;
    if (dto.body !== undefined) c.body = dto.body;
    if (dto.scheduledAt !== undefined) c.scheduledAt = new Date(dto.scheduledAt);
    if (dto.cron !== undefined) c.cron = dto.cron;
    await this.campaignRepo.save(c);
    // 아직 대기/활성인 경우에만 재예약 (이미 발송/취소된 공지는 그대로)
    if (c.status === CampaignStatus.SCHEDULED || c.status === CampaignStatus.ACTIVE) {
      await this.unscheduleCampaign(c);
      await this.scheduleCampaign(c);
    }
    return c;
  }

  async pauseCampaign(id: string): Promise<NotificationCampaign> {
    const c = await this.requireBatch(id);
    c.status = CampaignStatus.PAUSED;
    await this.campaignRepo.save(c);
    await this.unscheduleCampaign(c);
    return c;
  }

  async resumeCampaign(id: string): Promise<NotificationCampaign> {
    const c = await this.requireBatch(id);
    c.status = CampaignStatus.ACTIVE;
    await this.campaignRepo.save(c);
    await this.scheduleCampaign(c);
    return c;
  }

  async deleteCampaign(id: string): Promise<void> {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) return;
    await this.unscheduleCampaign(c);
    await this.campaignRepo.delete({ id });
  }

  private async requireBatch(id: string): Promise<NotificationCampaign> {
    const c = await this.campaignRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException("캠페인을 찾을 수 없습니다.");
    if (c.type !== CampaignType.BATCH) {
      throw new BadRequestException("배치 알림만 정지/재개할 수 있습니다.");
    }
    return c;
  }

  // ───────────────────────── BullMQ 스케줄링 ─────────────────────────

  private async scheduleCampaign(c: NotificationCampaign): Promise<void> {
    if (c.type === CampaignType.ANNOUNCEMENT) {
      const delay = Math.max(0, (c.scheduledAt?.getTime() ?? 0) - Date.now());
      await this.queue.add(
        "campaign",
        { campaignId: c.id },
        { jobId: c.id, delay, removeOnComplete: true, removeOnFail: false },
      );
    } else {
      await this.queue.upsertJobScheduler(
        c.id,
        { pattern: c.cron!, tz: "Asia/Seoul" },
        { name: "campaign", data: { campaignId: c.id } },
      );
    }
  }

  private async unscheduleCampaign(c: NotificationCampaign): Promise<void> {
    if (c.type === CampaignType.ANNOUNCEMENT) {
      const job = await this.queue.getJob(c.id);
      if (job) await job.remove().catch(() => undefined);
    } else {
      await this.queue.removeJobScheduler(c.id).catch(() => undefined);
    }
  }
}
