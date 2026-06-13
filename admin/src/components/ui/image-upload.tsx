'use client';

import { useRef, useState } from 'react';
import { Button } from './button';

interface ImageUploadProps {
  value?: string | null;
  onChange: (mediaId: string | null, imageUrl: string | null) => void;
  onUpload: (file: File) => Promise<{ id: string; url: string }>;
  isUploading?: boolean;
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  isUploading,
  label = '아이콘 이미지',
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setError(null);

    try {
      const result = await onUpload(file);
      setPreviewUrl(result.url);
      onChange(result.id, result.url);
    } catch (err) {
      setError('업로드에 실패했습니다.');
      console.error(err);
    }

    // input 초기화
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      <div className="flex items-start gap-4">
        {/* 이미지 미리보기 */}
        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="미리보기"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            isLoading={isUploading}
            disabled={isUploading}
          >
            {previewUrl ? '이미지 변경' : '이미지 선택'}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={handleRemove}
              disabled={isUploading}
            >
              삭제
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        PNG, JPG, GIF (최대 5MB)
      </p>
    </div>
  );
}
