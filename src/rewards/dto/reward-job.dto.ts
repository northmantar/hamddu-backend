import { RewardAction } from '../constants/reward-events';

export interface RewardJobPayload {
  memberId: string;
  refType: string;
  refAction: RewardAction;
  refId: string;
  metadata?: {
    contentId?: string;
    pointApplyable?: boolean;
  };
}
