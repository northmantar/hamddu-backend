'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { XpLevel } from '@/types';

export interface XpLevelFormData {
  level?: number;
  label: string;
  xpThreshold: number;
}

interface XpLevelFormProps {
  initialData?: XpLevel;
  onSubmit: (dto: XpLevelFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function XpLevelForm({ initialData, onSubmit, isLoading, onCancel }: XpLevelFormProps) {
  const [level, setLevel] = useState('');
  const [label, setLabel] = useState('');
  const [xpThreshold, setXpThreshold] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setLevel(String(initialData.level));
      setLabel(initialData.label ?? initialData.name ?? '');
      setXpThreshold(String(initialData.xpThreshold ?? initialData.minXp ?? 0));
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!initialData && (!level || isNaN(parseInt(level)) || parseInt(level) < 1)) {
      newErrors.level = '1 이상의 정수를 입력해주세요.';
    }
    if (!label.trim()) newErrors.label = '레벨 이름을 입력해주세요.';
    if (!xpThreshold || isNaN(parseInt(xpThreshold)) || parseInt(xpThreshold) < 0) {
      newErrors.xpThreshold = '0 이상의 정수를 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const dto: XpLevelFormData = {
      label: label.trim(),
      xpThreshold: parseInt(xpThreshold),
    };
    if (!initialData) dto.level = parseInt(level);
    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <Input
          type="number"
          label="레벨"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          error={errors.level}
          placeholder="1"
          min={1}
        />
      )}

      <Input
        label="이름"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        error={errors.label}
        placeholder="새싹 뜨개러"
      />

      <Input
        type="number"
        label="XP 임계값"
        value={xpThreshold}
        onChange={(e) => setXpThreshold(e.target.value)}
        error={errors.xpThreshold}
        placeholder="0"
        min={0}
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
