import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeviceToken } from "@entities/device-token.entity";
import { NotificationCampaign } from "@entities/notification-campaign.entity";
import { NotificationTemplate } from "@entities/notification-template.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { NOTIFICATION_QUEUE } from "./constants";
import { FirebaseService } from "./firebase.service";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationProcessor } from "./notification.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 86400 * 7, count: 1000 },
        removeOnFail: { age: 86400 * 30 },
      },
    }),
    TypeOrmModule.forFeature([
      DeviceToken,
      NotificationCampaign,
      NotificationTemplate,
      XpLevelPolicy,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [FirebaseService, NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
