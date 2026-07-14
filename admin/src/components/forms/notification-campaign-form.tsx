'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { CampaignType, NotificationCampaign } from '@/types';

export interface CampaignFormData {
  type: CampaignType;
  title: string;
  body: string;
  scheduledAt?: string; // ISO
  cron?: string;
}

interface Props {
  initialData?: NotificationCampaign;
  onSubmit: (dto: CampaignFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

const CRON_PRESETS = [
  { value: '0 9 * * *', label: '매일 오전 9시' },
  { value: '0 19 * * *', label: '매일 저녁 7시' },
  { value: '0 9 * * 1', label: '매주 월요일 오전 9시' },
  { value: '0 12 1 * *', label: '매월 1일 정오' },
];

// ISO → datetime-local 값('YYYY-MM-DDTHH:mm', 로컬 시각)
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NotificationCampaignForm({ initialData, onSubmit, isLoading, onCancel }: Props) {
  const [type, setType] = useState<CampaignType>('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState(''); // datetime-local
  const [cron, setCron] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setBody(initialData.body);
      setScheduledAt(toLocalInput(initialData.scheduledAt));
      setCron(initialData.cron ?? '');
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!title.trim()) err.title = '제목을 입력해주세요.';
    if (!body.trim()) err.body = '본문을 입력해주세요.';
    if (type === 'ANNOUNCEMENT' && !scheduledAt) err.scheduledAt = '발송 시각을 선택해주세요.';
    if (type === 'BATCH' && !cron.trim()) err.cron = 'cron 패턴을 입력해주세요.';
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const dto: CampaignFormData = { type, title: title.trim(), body: body.trim() };
    if (type === 'ANNOUNCEMENT') dto.scheduledAt = new Date(scheduledAt).toISOString();
    else dto.cron = cron.trim();
    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="알림 유형"
        value={type}
        onChange={(e) => setType(e.target.value as CampaignType)}
        disabled={!!initialData}
        options={[
          { value: 'ANNOUNCEMENT', label: '공지 (단발 · 예약 발송)' },
          { value: 'BATCH', label: '배치 (반복 발송)' },
        ]}
      />

      <Input
        label="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="알림 제목"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="알림 본문"
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.body ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
      </div>

      {type === 'ANNOUNCEMENT' ? (
        <Input
          type="datetime-local"
          label="발송 시각"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          error={errors.scheduledAt}
        />
      ) : (
        <>
          <Select
            label="반복 주기 (프리셋)"
            value={CRON_PRESETS.some((p) => p.value === cron) ? cron : ''}
            onChange={(e) => setCron(e.target.value)}
            placeholder="직접 입력"
            options={CRON_PRESETS}
          />
          <Input
            label="cron 패턴 (Asia/Seoul)"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            error={errors.cron}
            placeholder="0 9 * * *"
          />
        </>
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
