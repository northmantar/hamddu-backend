'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RewardEvent } from '@/types';

/** 계측된 보상 이벤트 레지스트리 — 액션 타입(카탈로그) 생성 시 선택지 */
export function useRewardEvents() {
  return useQuery({
    queryKey: ['points', 'reward-events'],
    queryFn: async () => {
      const res = await api.get<{ data: RewardEvent[] }>('/points/reward-events');
      return res.data;
    },
  });
}
