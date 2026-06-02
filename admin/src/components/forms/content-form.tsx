'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CreateContentDto, Channel } from '@/types';

interface ContentFormProps {
  channels: Channel[];
  onSubmit: (dto: CreateContentDto) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ContentForm({ channels, onSubmit, isLoading, onCancel }: ContentFormProps) {
  const [channelId, setChannelId] = useState('');
  const [platformContentId, setPlatformContentId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!channelId) {
      newErrors.channelId = 'Channel is required';
    }

    if (!platformContentId.trim()) {
      newErrors.platformContentId = 'Content ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      channelId,
      platformContentId: platformContentId.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Channel"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        error={errors.channelId}
        placeholder="Select a channel"
        options={channels.map((ch) => ({
          value: ch.id,
          label: `${ch.name} (${ch.platformType})`,
        }))}
      />

      <Input
        label="Content ID"
        value={platformContentId}
        onChange={(e) => setPlatformContentId(e.target.value)}
        error={errors.platformContentId}
        placeholder="Video ID or Content ID"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Add Content
        </Button>
      </div>
    </form>
  );
}
