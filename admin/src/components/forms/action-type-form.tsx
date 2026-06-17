'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ActionTypeFormData {
  code: string;
  labelKo: string;
}

interface ActionTypeFormProps {
  initialData?: { code: string; labelKo: string };
  onSubmit: (dto: ActionTypeFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ActionTypeForm({ initialData, onSubmit, isLoading, onCancel }: ActionTypeFormProps) {
  const [code, setCode] = useState('');
  const [labelKo, setLabelKo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setLabelKo(initialData.labelKo);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = '코드를 입력해주세요.';
    if (!labelKo.trim()) newErrors.labelKo = '한글 라벨을 입력해주세요.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    await onSubmit({ code: code.trim(), labelKo: labelKo.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="코드"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        error={errors.code}
        placeholder="WATCH, COMMENT_LIKE 등 (대문자)"
        disabled={!!initialData}
      />
      <Input
        label="한글 라벨"
        value={labelKo}
        onChange={(e) => setLabelKo(e.target.value)}
        error={errors.labelKo}
        placeholder="시청"
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
