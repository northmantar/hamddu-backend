'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import type { ChannelDetail, ChannelLinkInput, ChannelLinkType, UpdateChannelDto } from '@/types';

const LINK_TYPE_OPTIONS: Array<{ value: ChannelLinkType; label: string }> = [
  { value: 'instagram', label: '인스타그램' },
  { value: 'smartstore', label: '네이버 스마트스토어' },
  { value: 'youtube', label: '유튜브' },
  { value: 'website', label: '웹사이트' },
  { value: 'etc', label: '기타' },
];

interface ChannelHomeFormProps {
  channel: ChannelDetail;
  onSubmit: (dto: UpdateChannelDto) => Promise<void>;
  onUploadMedia: (file: File) => Promise<{ id: string; url: string }>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ChannelHomeForm({
  channel,
  onSubmit,
  onUploadMedia,
  isLoading,
  onCancel,
}: ChannelHomeFormProps) {
  const [description, setDescription] = useState(channel.description ?? '');
  const [profileMediaId, setProfileMediaId] = useState<string | null>(channel.profileMediaId);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(channel.profileImageUrl);
  const [bannerMediaId, setBannerMediaId] = useState<string | null>(channel.bannerMediaId);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(channel.bannerImageUrl);
  const [links, setLinks] = useState<ChannelLinkInput[]>(
    channel.links.map((link) => ({ type: link.type, url: link.url, label: link.label })),
  );
  const [error, setError] = useState<string | null>(null);

  const updateLink = (index: number, patch: Partial<ChannelLinkInput>) => {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { type: 'instagram', url: '', label: null }]);
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    setLinks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const validate = (): string | null => {
    for (const [i, link] of links.entries()) {
      if (!link.url.trim()) {
        return `${i + 1}번 링크의 URL을 입력해주세요.`;
      }
      if (!/^https?:\/\//i.test(link.url.trim())) {
        return `${i + 1}번 링크는 http:// 또는 https:// 로 시작해야 합니다.`;
      }
      if (link.type === 'etc' && !link.label?.trim()) {
        return `${i + 1}번 링크는 기타 종류이므로 표시명이 필요합니다.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    await onSubmit({
      // 빈 문자열은 null로 보내 소개글을 삭제한다
      description: description.trim() || null,
      profileMediaId,
      bannerMediaId,
      links: links.map((link) => ({
        type: link.type,
        url: link.url.trim(),
        label: link.type === 'etc' ? link.label?.trim() : null,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="채널 홈에 노출될 소개글을 입력하세요."
          className="border rounded-lg px-3 py-2 w-full text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">{description.length} / 2000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ImageUpload
          label="프로필 이미지"
          value={profileImageUrl}
          onChange={(mediaId, imageUrl) => {
            setProfileMediaId(mediaId);
            setProfileImageUrl(imageUrl);
          }}
          onUpload={onUploadMedia}
        />
        <ImageUpload
          label="배너 이미지"
          value={bannerImageUrl}
          onChange={(mediaId, imageUrl) => {
            setBannerMediaId(mediaId);
            setBannerImageUrl(imageUrl);
          }}
          onUpload={onUploadMedia}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">외부 링크</label>
          <Button type="button" size="sm" variant="secondary" onClick={addLink}>
            링크 추가
          </Button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-gray-500 py-3">등록된 링크가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-start gap-2 border rounded-lg p-2">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => moveLink(index, -1)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                    title="위로"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(index, 1)}
                    disabled={index === links.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                    title="아래로"
                  >
                    ▼
                  </button>
                </div>

                <div className="w-32 shrink-0">
                  <Select
                    value={link.type}
                    onChange={(e) => updateLink(index, { type: e.target.value as ChannelLinkType })}
                    options={LINK_TYPE_OPTIONS}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                    placeholder="https://..."
                  />
                  {link.type === 'etc' && (
                    <Input
                      value={link.label ?? ''}
                      onChange={(e) => updateLink(index, { label: e.target.value })}
                      placeholder="표시명 (기타 종류는 필수)"
                    />
                  )}
                </div>

                <Button type="button" size="sm" variant="danger" onClick={() => removeLink(index)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          저장
        </Button>
      </div>
    </form>
  );
}
