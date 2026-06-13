'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Media } from '@/types';

export function useUploadMedia() {
  return useMutation({
    mutationFn: (file: File) => api.upload<Media>('/media/upload', file),
  });
}
