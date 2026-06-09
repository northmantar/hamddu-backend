'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CreateChannelDto, ChannelPlatform } from '@/types';

interface ChannelFormProps {
  onSubmit: (dto: CreateChannelDto) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ChannelForm({ onSubmit, isLoading, onCancel }: ChannelFormProps) {
  const [platform, setPlatform] = useState<ChannelPlatform>('youtube');
  const [sourceChannelId, setSourceChannelId] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!sourceChannelId.trim()) newErrors.sourceChannelId = '채널 ID를 입력해주세요.';
    if (!name.trim()) newErrors.name = '채널명을 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ platform, sourceChannelId: sourceChannelId.trim(), name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="플랫폼"
        value={platform}
        onChange={(e) => setPlatform(e.target.value as ChannelPlatform)}
        options={[{ value: 'youtube', label: 'YouTube' }]}
      />
      <Input
        label="채널 ID"
        value={sourceChannelId}
        onChange={(e) => setSourceChannelId(e.target.value)}
        error={errors.sourceChannelId}
        placeholder="UCxxxxxxxxxxxxxx"
      />
      <Input
        label="채널명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="채널 이름 입력"
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>취소</Button>
        <Button type="submit" isLoading={isLoading}>추가</Button>
      </div>
    </form>
  );
}
