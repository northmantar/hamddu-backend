export const POINT_QUEUE = 'reward-point';
export const XP_QUEUE = 'reward-xp';

export enum RewardActionType {
  CHALLENGE_CREATED = 'CHALLENGE_CREATED',
  VIDEO_WATCHED     = 'VIDEO_WATCHED',
  BOARD_CREATED     = 'BOARD_CREATED',
  COMMENT_CREATED   = 'COMMENT_CREATED',
}

export const XP_AMOUNT_MAP: Record<RewardActionType, number> = {
  [RewardActionType.CHALLENGE_CREATED]: 50,
  [RewardActionType.VIDEO_WATCHED]:     30,
  [RewardActionType.BOARD_CREATED]:     20,
  [RewardActionType.COMMENT_CREATED]:   10,
};
