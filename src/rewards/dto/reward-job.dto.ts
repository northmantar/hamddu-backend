import { RewardActionType } from '../constants/reward.constants';
import { RewardAction } from '../constants/reward-events';

export interface RewardJobPayload {
  memberId: string;
  refType: string;
  refAction: RewardAction;
  refId: string;
  /**
   * 전환기 한정: XP 프로세서가 아직 RewardActionType 기반(XP_AMOUNT_MAP)이라 유지.
   * XP도 데이터 주도로 전환되면 제거한다. (ref/reward-policy-v2.md §4, §11)
   */
  actionType?: RewardActionType;
  metadata?: {
    contentId?: string;
    pointApplyable?: boolean;
  };
}
