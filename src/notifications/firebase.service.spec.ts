import { ConfigService } from "@nestjs/config";
import { FirebaseService } from "./firebase.service";

describe("FirebaseService", () => {
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
      "FCM 응답 실패(1건, codes=messaging/invalid-registration-token)",
    );
  });
});
