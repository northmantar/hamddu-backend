'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { Category } from '@/types';

interface CategoryFormData {
  label: string;
  status?: 'enabled' | 'disabled';
}

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (dto: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function CategoryForm({ initialData, onSubmit, isLoading, onCancel }: CategoryFormProps) {
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<'enabled' | 'disabled'>('enabled');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label ?? initialData.name ?? '');
      const initStatus = (initialData.status === 'disabled' ? 'disabled' : 'enabled') as 'enabled' | 'disabled';
      setStatus(initStatus);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    setError('');
    await onSubmit({
      label: label.trim(),
      ...(initialData ? { status } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="이름"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        error={error}
        placeholder="카테고리 이름"
      />

      {initialData && (
        <Select
          label="상태"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'enabled' | 'disabled')}
          options={[
            { value: 'enabled', label: '활성' },
            { value: 'disabled', label: '비활성' },
          ]}
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
