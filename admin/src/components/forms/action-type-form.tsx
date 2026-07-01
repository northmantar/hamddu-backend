'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRewardEvents } from '@/hooks/queries/use-reward-events';
import type { RewardAction } from '@/types';

export interface ActionTypeFormData {
  code: string;
  labelKo: string;
  refType: string;
  refAction: RewardAction;
}

interface ActionTypeFormProps {
  initialData?: { code: string; labelKo: string; refType: string; refAction: RewardAction };
  onSubmit: (dto: ActionTypeFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

const encode = (refType: string, refAction: string) => `${refType}::${refAction}`;

export function ActionTypeForm({ initialData, onSubmit, isLoading, onCancel }: ActionTypeFormProps) {
  const { data: rewardEvents } = useRewardEvents();
  const [code, setCode] = useState('');
  const [labelKo, setLabelKo] = useState('');
  const [event, setEvent] = useState(''); // "refType::refAction"
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setLabelKo(initialData.labelKo);
      setEvent(encode(initialData.refType, initialData.refAction));
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = '코드를 입력해주세요.';
    if (!labelKo.trim()) newErrors.labelKo = '한글 라벨을 입력해주세요.';
    if (!event) newErrors.event = '보상 이벤트를 선택해주세요.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const [refType, refAction] = event.split('::');
    await onSubmit({ code: code.trim(), labelKo: labelKo.trim(), refType, refAction: refAction as RewardAction });
  };

  const eventOptions = (rewardEvents ?? []).map((e) => ({
    value: encode(e.refType, e.refAction),
    label: `${e.refType} / ${e.refAction}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="코드"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        error={errors.code}
        placeholder="BOARD_CREATE 등 (대문자)"
        disabled={!!initialData}
      />
      <Input
        label="한글 라벨"
        value={labelKo}
        onChange={(e) => setLabelKo(e.target.value)}
        error={errors.labelKo}
        placeholder="게시글 작성"
      />
      {initialData ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">보상 이벤트</label>
          <div className="text-sm text-gray-600 font-mono px-3 py-2 bg-gray-50 rounded border">
            {initialData.refType} / {initialData.refAction}
          </div>
          <p className="mt-1 text-xs text-gray-400">참조 테이블/액션은 생성 후 변경할 수 없습니다.</p>
        </div>
      ) : (
        <Select
          label="보상 이벤트 (참조 테이블 / 액션)"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          error={errors.event}
          placeholder="계측된 이벤트 선택"
          options={eventOptions}
        />
      )}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );
}
