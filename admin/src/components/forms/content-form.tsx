'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CreateContentDto, Channel, ContentType, UserInterests } from '@/types';

interface ContentFormProps {
  channels: Channel[];
  onSubmit: (dto: CreateContentDto) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'symbol', label: 'Symbol (튜토리얼)' },
  { value: 'free', label: 'Free' },
  { value: 'normal', label: 'Normal' },
];

const INTERESTS_OPTIONS: { value: UserInterests; label: string }[] = [
  { value: 'crochet', label: '코바늘 (Crochet)' },
  { value: 'knitting', label: '대바늘 (Knitting)' },
];

export function ContentForm({ channels, onSubmit, isLoading, onCancel }: ContentFormProps) {
  const [channelId, setChannelId] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>('normal');
  const [interests, setInterests] = useState<UserInterests | ''>('');
  const [sortOrder, setSortOrder] = useState('');
  const [pointApplyable, setPointApplyable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!channelId) newErrors.channelId = 'Channel is required';
    if (!youtubeVideoId.trim()) newErrors.youtubeVideoId = 'YouTube Video ID is required';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!type) newErrors.type = 'Type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dto: CreateContentDto = {
      channelId,
      youtubeVideoId: youtubeVideoId.trim(),
      name: name.trim(),
      type,
      ...(interests && { interests }),
      ...(sortOrder && { sortOrder: parseInt(sortOrder, 10) }),
      pointApplyable,
    };

    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Channel"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        error={errors.channelId}
        placeholder="채널 선택"
        options={channels.map((ch) => ({ value: ch.id, label: ch.name }))}
      />

      <Input
        label="YouTube Video ID"
        value={youtubeVideoId}
        onChange={(e) => setYoutubeVideoId(e.target.value)}
        error={errors.youtubeVideoId}
        placeholder="dQw4w9WgXcQ"
      />

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="콘텐츠 제목"
      />

      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as ContentType)}
        error={errors.type}
        options={CONTENT_TYPE_OPTIONS}
      />

      <Select
        label="Interests (선택)"
        value={interests}
        onChange={(e) => setInterests(e.target.value as UserInterests | '')}
        placeholder="선택 안 함"
        options={INTERESTS_OPTIONS}
      />

      <Input
        label="Sort Order (선택, 1부터 시작)"
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        placeholder="1"
      />

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={pointApplyable}
          onChange={(e) => setPointApplyable(e.target.checked)}
          className="rounded"
        />
        포인트 지급 대상
      </label>

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
