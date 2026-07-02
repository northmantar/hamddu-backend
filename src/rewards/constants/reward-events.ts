/**
 * 보상 이벤트 레지스트리 (단일 출처)
 *
 * 여기에 등록된 (refType, refAction) 쌍만:
 *  - 실제로 emit 되는 보상 이벤트이며
 *  - 어드민 카탈로그(point_action_types) 생성 시 선택 가능하다.
 *
 * 새 보상 표면을 계측할 때: 이 배열에 한 줄 추가 + 해당 호출부에 enqueueReward 한 줄 추가.
 * (ref/reward-policy-v2.md §15, §16 참고)
 */

export enum RewardAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export interface RewardEvent {
  refType: string;
  refAction: RewardAction;
}

export const REWARD_EVENTS: readonly RewardEvent[] = [
  { refType: "users", refAction: RewardAction.CREATE },
  { refType: "board", refAction: RewardAction.CREATE },
  { refType: "board_comment", refAction: RewardAction.CREATE },
  { refType: "challenge", refAction: RewardAction.CREATE },
  // 논리 이벤트: 물리 테이블이 아니라 "튜토리얼(symbol) 시청 완료" 도메인 이벤트.
  // refId 는 watch_history.id 를 담아 추적 가능. (ref/reward-policy-v2.md §14)
  { refType: "tutorial_watch", refAction: RewardAction.CREATE },
] as const;

/** (refType, refAction) 이 레지스트리에 등록된 보상 표면인지 */
export function isRegisteredRewardEvent(
  refType: string,
  refAction: string,
): boolean {
  return REWARD_EVENTS.some(
    (e) => e.refType === refType && e.refAction === refAction,
  );
}
