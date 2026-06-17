'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useXpActionTypes } from '@/hooks/queries/use-xp-policies';
import type { XpEarningPolicy } from '@/types';

export interface XpPolicyFormData {
  actionType?: string;
  xpAmount: number;
  isOneTime: boolean;
  isActive: boolean;
}

interface XpPolicyFormProps {
  initialData?: XpEarningPolicy;
  onSubmit: (dto: XpPolicyFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function XpPolicyForm({ initialData, onSubmit, isLoading, onCancel }: XpPolicyFormProps) {
  const { data: actionTypes } = useXpActionTypes();
  const [actionType, setActionType] = useState('');
  const [xpAmount, setXpAmount] = useState('1');
  const [isOneTime, setIsOneTime] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setActionType(initialData.actionType);
      setXpAmount(String(initialData.xpAmount));
      setIsOneTime(initialData.isOneTime);
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!initialData && !actionType) newErrors.actionType = '액션 타입을 선택해주세요.';
    const n = parseInt(xpAmount);
    if (!xpAmount || isNaN(n) || n < 1) newErrors.xpAmount = '1 이상의 정수를 입력해주세요.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const dto: XpPolicyFormData = { xpAmount: parseInt(xpAmount), isOneTime, isActive };
    if (!initialData) dto.actionType = actionType;
    await onSubmit(dto);
  };

  const actionTypeOptions = (actionTypes ?? [])
    .filter((at) => at.isActive)
    .map((at) => ({ value: at.code, label: `${at.labelKo} (${at.code})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <Select
          label="액션 타입"
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          error={errors.actionType}
          placeholder="액션 타입 선택"
          options={actionTypeOptions}
        />
      )}

      <Input
        type="number"
        label="지급 XP"
        value={xpAmount}
        onChange={(e) => setXpAmount(e.target.value)}
        error={errors.xpAmount}
        placeholder="1"
        min={1}
      />

      <Select
        label="1회성 적립"
        value={isOneTime ? 'true' : 'false'}
        onChange={(e) => setIsOneTime(e.target.value === 'true')}
        options={[
          { value: 'false', label: '반복 가능' },
          { value: 'true', label: '최초 1회만' },
        ]}
      />

      <Select
        label="상태"
        value={isActive ? 'true' : 'false'}
        onChange={(e) => setIsActive(e.target.value === 'true')}
        options={[
          { value: 'true', label: '활성' },
          { value: 'false', label: '비활성' },
        ]}
      />

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
