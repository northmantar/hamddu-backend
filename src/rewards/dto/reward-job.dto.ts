import { RewardActionType } from '../constants/reward.constants';

export interface RewardJobPayload {
  memberId: string;
  actionType: RewardActionType;
  refId: string;
  refType: string;
  metadata?: {
    contentId?: string;
    pointApplyable?: boolean;
  };
}
