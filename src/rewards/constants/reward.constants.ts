export const POINT_QUEUE = 'reward-point';
export const XP_QUEUE = 'reward-xp';

export enum RewardActionType {
  CHALLENGE_CREATED = 'CHALLENGE_CREATED',
  VIDEO_WATCHED     = 'VIDEO_WATCHED',
  BOARD_CREATED     = 'BOARD_CREATED',
  COMMENT_CREATED   = 'COMMENT_CREATED',
  USER_SIGNUP       = 'USER_SIGNUP',
}

// XP 지급액 (전환기 하드코딩 — XP 데이터주도 전환 시 xp_earning_policies 로 이동)
export const XP_AMOUNT_MAP: Record<RewardActionType, number> = {
  [RewardActionType.CHALLENGE_CREATED]: 50,
  [RewardActionType.VIDEO_WATCHED]:     30,
  [RewardActionType.BOARD_CREATED]:     20,
  [RewardActionType.COMMENT_CREATED]:   10,
  [RewardActionType.USER_SIGNUP]:       100,
};
