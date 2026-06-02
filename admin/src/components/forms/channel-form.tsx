'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CreateChannelDto } from '@/types';

interface ChannelFormProps {
  onSubmit: (dto: CreateChannelDto) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ChannelForm({ onSubmit, isLoading, onCancel }: ChannelFormProps) {
  const [platformType, setPlatformType] = useState<'youtube' | 'chzzk'>('youtube');
  const [channelId, setChannelId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!channelId.trim()) {
      newErrors.channelId = 'Channel ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      platformType,
      channelId: channelId.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Platform"
        value={platformType}
        onChange={(e) => setPlatformType(e.target.value as 'youtube' | 'chzzk')}
        options={[
          { value: 'youtube', label: 'YouTube' },
          { value: 'chzzk', label: 'Chzzk' },
        ]}
      />

      <Input
        label="Channel ID"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        error={errors.channelId}
        placeholder={platformType === 'youtube' ? 'UCxxxxxxxxxxxxxx' : 'channel_id'}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Add Channel
        </Button>
      </div>
    </form>
  );
}
