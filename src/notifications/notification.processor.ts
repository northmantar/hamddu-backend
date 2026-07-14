import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { NOTIFICATION_QUEUE } from "./constants";
import { NotificationsService } from "./notifications.service";

/**
 * 알림 발송 워커.
 *  - name='campaign' : { campaignId }  → 공지/배치 토픽 발송
 *  - name='level_up' : { userId, level } → 레벨업 유저 발송
 */
@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly service: NotificationsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      if (job.name === "campaign") {
        await this.service.runCampaign(job.data.campaignId);
      } else if (job.name === "level_up") {
        await this.service.sendLevelUp(job.data.userId, job.data.level);
      }
    } catch (e) {
      this.logger.error(`알림 발송 실패(job=${job.name}/${job.id}): ${(e as Error).message}`);
      throw e;
    }
  }
}
