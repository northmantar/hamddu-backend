import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

/** FCM 전송 원시 기능. 자격증명 없으면 no-op 으로 동작(로컬/개발 부팅 허용). */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const raw = this.config.get<string>("FIREBASE_SERVICE_ACCOUNT");
    if (!raw) {
      this.logger.warn(
        "FIREBASE_SERVICE_ACCOUNT 미설정 → 푸시 발송 비활성화(no-op)",
      );
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      const app = admin.apps.length
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
      this.messaging = app.messaging();
      this.logger.log("Firebase Admin 초기화 완료");
    } catch (e) {
      this.logger.error(
        `Firebase 초기화 실패: ${(e as Error).message} → 발송 비활성화`,
      );
    }
  }

  get enabled(): boolean {
    return this.messaging !== null;
  }

  /** 토픽 전체 브로드캐스트 (공지/배치). */
  async sendToTopic(
    topic: string,
    notification: { title: string; body: string },
  ): Promise<void> {
    if (!this.messaging) return;
    await this.messaging.send({ topic, notification });
  }

  /** 디바이스 토큰 다건 발송. 등록만료/무효 토큰을 반환 → 호출측이 삭제. */
  async sendToTokens(
    tokens: string[],
    notification: { title: string; body: string },
  ): Promise<{ invalidTokens: string[] }> {
    if (!this.messaging || tokens.length === 0) return { invalidTokens: [] };
    const res = await this.messaging.sendEachForMulticast({
      tokens,
      notification,
    });
    const invalidTokens: string[] = [];
    res.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        invalidTokens.push(tokens[i]);
      }
    });
    return { invalidTokens };
  }

  /** 디바이스를 전체 브로드캐스트 토픽에 구독. */
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    if (!this.messaging) return;
    const res = await this.messaging.subscribeToTopic([token], topic);
    if (res.failureCount > 0) {
      const codes = res.errors.map(({ error }) => error.code).join(", ");
      throw new Error(`FCM 응답 실패(${res.failureCount}건, codes=${codes})`);
    }
  }
}
