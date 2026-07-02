'use client';

import { useState, FormEvent, useEffect, useMemo } from 'react';
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

export function ActionTypeForm({ initialData, onSubmit, isLoading, onCancel }: ActionTypeFormProps) {
  const { data: rewardEvents } = useRewardEvents();
  const [code, setCode] = useState('');
  const [labelKo, setLabelKo] = useState('');
  const [refType, setRefType] = useState('');
  const [refAction, setRefAction] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setLabelKo(initialData.labelKo);
      setRefType(initialData.refType);
      setRefAction(initialData.refAction);
    }
  }, [initialData]);

  // 참조 테이블 = 레지스트리의 distinct refType
  const tableOptions = useMemo(() => {
    const seen = new Set<string>();
    return (rewardEvents ?? [])
      .filter((e) => (seen.has(e.refType) ? false : (seen.add(e.refType), true)))
      .map((e) => ({ value: e.refType, label: e.refType }));
  }, [rewardEvents]);

  // 선택한 테이블에 대해 레지스트리에 등록된 액션만
  const actionOptions = useMemo(
    () =>
      (rewardEvents ?? [])
        .filter((e) => e.refType === refType)
        .map((e) => ({ value: e.refAction, label: e.refAction })),
    [rewardEvents, refType],
  );

  const handleTableChange = (value: string) => {
    setRefType(value);
    // 테이블 바뀌면 액션 초기화 (등록된 쌍만 유지)
    const avail = (rewardEvents ?? []).filter((e) => e.refType === value).map((e) => e.refAction);
    setRefAction(avail.length === 1 ? avail[0] : '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = '코드를 입력해주세요.';
    if (!labelKo.trim()) newErrors.labelKo = '한글 라벨을 입력해주세요.';
    if (!refType) newErrors.refType = '참조 테이블을 선택해주세요.';
    if (!refAction) newErrors.refAction = '액션을 선택해주세요.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    await onSubmit({ code: code.trim(), labelKo: labelKo.trim(), refType, refAction: refAction as RewardAction });
  };

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
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="참조 테이블"
            value={refType}
            onChange={(e) => handleTableChange(e.target.value)}
            error={errors.refType}
            placeholder="테이블 선택"
            options={tableOptions}
          />
          <Select
            label="액션"
            value={refAction}
            onChange={(e) => setRefAction(e.target.value)}
            error={errors.refAction}
            placeholder={refType ? '액션 선택' : '테이블 먼저 선택'}
            options={actionOptions}
          />
        </div>
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
