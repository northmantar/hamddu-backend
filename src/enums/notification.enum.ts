export enum CampaignType {
  ANNOUNCEMENT = "ANNOUNCEMENT", // 단발성 공지 (예약 발송)
  BATCH = "BATCH", // 반복성 리마인드 (cron)
}

export enum CampaignStatus {
  SCHEDULED = "SCHEDULED", // 공지: 발송 대기
  SENT = "SENT", // 공지: 발송 완료
  ACTIVE = "ACTIVE", // 배치: 반복 중
  PAUSED = "PAUSED", // 배치: 일시정지
  CANCELED = "CANCELED", // 취소
}
