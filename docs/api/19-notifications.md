# 알림(FCM) API

Firebase Cloud Messaging 푸시 알림. 모든 엔드포인트는 `/notifications` 하위, Bearer 인증(JwtAuthGuard) 필요.
어드민 전용 엔드포인트는 추가로 AdminGuard 적용.

알림 성격
- **공지(ANNOUNCEMENT)**: 단발성, `scheduledAt` 예약 발송. 발송 후 `SENT`.
- **배치(BATCH)**: 반복성, `cron` 패턴 발송. `ACTIVE`/`PAUSED`.
- **레벨업(이벤트성)**: XP가 레벨 임계값 도달 시 자동. 문구는 `level_up` 템플릿(어드민 편집).

공지·배치 발송 대상은 **전체 유저**(FCM topic `all`). 레벨업은 해당 유저 디바이스 토큰으로 발송.

---

## 앱: 디바이스 토큰

### `POST /notifications/device-tokens`
FCM 토큰 등록(로그인/토큰 갱신 시). 등록 시 topic `all` 자동 구독. 응답 `204`.
```json
{ "token": "fcm-device-token", "platform": "ios" }   // platform 선택
```

### `DELETE /notifications/device-tokens/:token`
토큰 해제(로그아웃/만료). 응답 `204`.

---

## 어드민: 레벨업 템플릿

### `GET /notifications/templates/level-up`
현재 레벨업 알림 템플릿 조회.

### `PATCH /notifications/templates/level-up`
문구/활성 여부 수정. `body`에 `{level}`(레벨 번호), `{label}`(칭호) 치환자 사용 가능.
```json
{ "title": "레벨업! 🎉", "body": "{label}(Lv.{level}) 달성!", "isActive": true }
```

---

## 어드민: 공지/배치 캠페인

### `GET /notifications/campaigns`
캠페인 목록(최신순).

### `POST /notifications/campaigns`
캠페인 생성. `type`에 따라 필수 필드가 다름.
```json
// 공지(예약)
{ "type": "ANNOUNCEMENT", "title": "점검 안내", "body": "...", "scheduledAt": "2026-07-20T09:00:00+09:00" }
// 배치(반복) — cron, tz=Asia/Seoul
{ "type": "BATCH", "title": "오늘도 떠볼까요?", "body": "...", "cron": "0 19 * * *" }
```
- 공지에 `scheduledAt` 누락 / 배치에 `cron` 누락 시 `400`.

### `PATCH /notifications/campaigns/:id`
`title`/`body`/`scheduledAt`/`cron` 수정. 대기(`SCHEDULED`)/활성(`ACTIVE`) 상태면 재예약.

### `POST /notifications/campaigns/:id/pause` · `POST .../resume`
배치 알림 일시정지/재개(배치 전용, 공지는 `400`).

### `DELETE /notifications/campaigns/:id`
캠페인 삭제(예약 취소 포함). 응답 `204`.

---

## 운영 메모
- 자격증명(`FIREBASE_SERVICE_ACCOUNT`, 서비스 계정 JSON 문자열) 미설정 시 발송은 no-op(앱 부팅은 정상).
- 스케줄링은 BullMQ `notification` 큐 사용(공지=delayed job, 배치=job scheduler). Redis에 영속되어 앱 재시작에도 유지.
