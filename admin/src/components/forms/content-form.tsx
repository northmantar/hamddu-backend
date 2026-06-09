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
  { value: 'symbol', label: '튜토리얼 (symbol)' },
  { value: 'free', label: '무료 도안 (free)' },
  { value: 'normal', label: '일반 (normal)' },
];

const INTERESTS_OPTIONS: { value: UserInterests; label: string }[] = [
  { value: 'crochet', label: '코바늘' },
  { value: 'knitting', label: '대바늘' },
];

export function ContentForm({ channels, onSubmit, isLoading, onCancel }: ContentFormProps) {
  const [channelId, setChannelId] = useState('');
  const [sourceVideoId, setSourceVideoId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>('normal');
  const [interests, setInterests] = useState<UserInterests | ''>('');
  const [sortOrder, setSortOrder] = useState('');
  const [pointApplyable, setPointApplyable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!channelId) newErrors.channelId = '채널을 선택해주세요.';
    if (!sourceVideoId.trim()) newErrors.sourceVideoId = 'Video ID를 입력해주세요.';
    if (!name.trim()) newErrors.name = '제목을 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      channelId,
      sourceVideoId: sourceVideoId.trim(),
      name: name.trim(),
      type,
      ...(interests && { interests }),
      ...(sortOrder && { sortOrder: parseInt(sortOrder, 10) }),
      pointApplyable,
      status: 'active',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="채널"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        error={errors.channelId}
        options={[
          { value: '', label: '채널 선택' },
          ...channels.map((ch) => ({ value: ch.id, label: ch.name })),
        ]}
      />
      <Input
        label="Video ID"
        value={sourceVideoId}
        onChange={(e) => setSourceVideoId(e.target.value)}
        error={errors.sourceVideoId}
        placeholder="플랫폼 비디오 ID"
      />
      <Input
        label="제목"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="콘텐츠 제목"
      />
      <Select
        label="유형"
        value={type}
        onChange={(e) => setType(e.target.value as ContentType)}
        options={CONTENT_TYPE_OPTIONS}
      />
      <Select
        label="관심사 (선택)"
        value={interests}
        onChange={(e) => setInterests(e.target.value as UserInterests | '')}
        options={[{ value: '', label: '선택 안 함' }, ...INTERESTS_OPTIONS]}
      />
      <Input
        label="순서 (선택, 1부터 시작)"
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
        <Button type="button" variant="secondary" onClick={onCancel}>취소</Button>
        <Button type="submit" isLoading={isLoading}>추가</Button>
      </div>
    </form>
  );
}
