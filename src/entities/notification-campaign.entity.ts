import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CampaignStatus, CampaignType } from "../enums/notification.enum";

/**
 * 어드민 관리 알림 캠페인 (공지 + 배치).
 *  - ANNOUNCEMENT: 단발성. scheduledAt 시각에 1회 발송 → SENT.
 *  - BATCH: 반복성. cron 패턴으로 반복 발송 (전체 유저 topic 'all').
 */
@Entity("notification_campaigns")
export class NotificationCampaign {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: CampaignType })
  type: CampaignType;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "timestamptz", nullable: true })
  scheduledAt: Date | null; // ANNOUNCEMENT 전용

  @Column({ nullable: true })
  cron: string | null; // BATCH 전용 (cron 패턴)

  @Column({ type: "enum", enum: CampaignStatus })
  status: CampaignStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
