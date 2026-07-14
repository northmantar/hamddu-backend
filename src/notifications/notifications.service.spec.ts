import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getQueueToken } from "@nestjs/bullmq";
import { BadRequestException } from "@nestjs/common";
import { DeviceToken } from "@entities/device-token.entity";
import { NotificationCampaign } from "@entities/notification-campaign.entity";
import { NotificationTemplate } from "@entities/notification-template.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { CampaignType } from "../enums/notification.enum";
import { NotificationsService } from "./notifications.service";
import { FirebaseService } from "./firebase.service";
import { NOTIFICATION_QUEUE } from "./constants";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let tokenRepo: any;
  let templateRepo: any;
  let levelRepo: any;
  let firebase: any;

  beforeEach(async () => {
    tokenRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn() };
    templateRepo = { findOne: jest.fn() };
    levelRepo = { findOne: jest.fn() };
    firebase = { sendToTokens: jest.fn(), sendToTopic: jest.fn(), subscribeToTopic: jest.fn() };
    const campaignRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn((x: any) => x), delete: jest.fn() };
    const queue = { add: jest.fn(), upsertJobScheduler: jest.fn(), getJob: jest.fn(), removeJobScheduler: jest.fn() };

    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(DeviceToken), useValue: tokenRepo },
        { provide: getRepositoryToken(NotificationCampaign), useValue: campaignRepo },
        { provide: getRepositoryToken(NotificationTemplate), useValue: templateRepo },
        { provide: getRepositoryToken(XpLevelPolicy), useValue: levelRepo },
        { provide: FirebaseService, useValue: firebase },
        { provide: getQueueToken(NOTIFICATION_QUEUE), useValue: queue },
      ],
    }).compile();
    service = mod.get(NotificationsService);
  });

  it("무효 토큰은 발송 후 삭제한다", async () => {
    tokenRepo.find.mockResolvedValue([{ token: "good" }, { token: "bad" }]);
    firebase.sendToTokens.mockResolvedValue({ invalidTokens: ["bad"] });
    await service.sendToUser("u1", { title: "t", body: "b" });
    expect(tokenRepo.delete).toHaveBeenCalledWith({ token: expect.anything() });
  });

  it("레벨업 문구의 {level}/{label} 을 치환한다", async () => {
    templateRepo.findOne.mockResolvedValue({ isActive: true, title: "Lv.{level}", body: "{label} 달성" });
    levelRepo.findOne.mockResolvedValue({ label: "숙련자" });
    tokenRepo.find.mockResolvedValue([{ token: "t" }]);
    firebase.sendToTokens.mockResolvedValue({ invalidTokens: [] });
    await service.sendLevelUp("u1", 3);
    expect(firebase.sendToTokens).toHaveBeenCalledWith(["t"], { title: "Lv.3", body: "숙련자 달성" });
  });

  it("비활성 템플릿이면 레벨업 발송을 건너뛴다", async () => {
    templateRepo.findOne.mockResolvedValue({ isActive: false, title: "x", body: "y" });
    await service.sendLevelUp("u1", 3);
    expect(firebase.sendToTokens).not.toHaveBeenCalled();
  });

  it("공지 캠페인은 scheduledAt 없으면 400", async () => {
    await expect(
      service.createCampaign({ type: CampaignType.ANNOUNCEMENT, title: "t", body: "b" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("배치 캠페인은 cron 없으면 400", async () => {
    await expect(
      service.createCampaign({ type: CampaignType.BATCH, title: "t", body: "b" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
