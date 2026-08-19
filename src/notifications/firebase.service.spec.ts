import { ConfigService } from "@nestjs/config";
import { FirebaseService } from "./firebase.service";

describe("FirebaseService", () => {
  it("토픽 발송 메시지 ID와 구독 성공 건수를 기록한다", async () => {
    const service = new FirebaseService({} as ConfigService);
    const log = jest.fn();
    (service as any).logger.log = log;
    (service as any).messaging = {
      send: jest.fn().mockResolvedValue("projects/hamddu/messages/123"),
      subscribeToTopic: jest.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        errors: [],
      }),
    };

    await service.sendToTopic("all", { title: "t", body: "b" });
    await service.subscribeToTopic("token", "all");

    expect(log).toHaveBeenCalledWith(
      "FCM 토픽 발송 성공(topic=all, messageId=projects/hamddu/messages/123)",
    );
    expect(log).toHaveBeenCalledWith("FCM 토픽 구독 성공(topic=all, success=1)");
  });

  it("토픽 구독 응답에 개별 실패가 있으면 오류로 처리한다", async () => {
    const service = new FirebaseService({} as ConfigService);
    (service as any).messaging = {
      subscribeToTopic: jest.fn().mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        errors: [{ index: 0, error: { code: "messaging/invalid-registration-token" } }],
      }),
    };

    await expect(service.subscribeToTopic("token", "all")).rejects.toThrow(
      "FCM 토픽 구독 실패(topic=all, success=0, failure=1, codes=messaging/invalid-registration-token)",
    );
  });
});
