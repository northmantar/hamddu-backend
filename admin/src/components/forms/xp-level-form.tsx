'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { XpLevel } from '@/types';

interface XpLevelFormData {
  level?: number;
  name: string;
  minXp: number;
  maxXp?: number;
}

interface XpLevelFormProps {
  initialData?: XpLevel;
  onSubmit: (dto: XpLevelFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function XpLevelForm({ initialData, onSubmit, isLoading, onCancel }: XpLevelFormProps) {
  const [level, setLevel] = useState('');
  const [name, setName] = useState('');
  const [minXp, setMinXp] = useState('0');
  const [maxXp, setMaxXp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setLevel(String(initialData.level));
      setName(initialData.name ?? initialData.label ?? '');
      setMinXp(String(initialData.minXp ?? initialData.xpThreshold ?? 0));
      setMaxXp(initialData.maxXp != null ? String(initialData.maxXp) : '');
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!initialData && (!level || isNaN(parseInt(level)) || parseInt(level) < 1)) {
      newErrors.level = 'Level must be a positive number';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!minXp || isNaN(parseInt(minXp)) || parseInt(minXp) < 0) {
      newErrors.minXp = 'Min XP must be a non-negative number';
    }

    if (maxXp && (isNaN(parseInt(maxXp)) || parseInt(maxXp) <= parseInt(minXp))) {
      newErrors.maxXp = 'Max XP must be greater than Min XP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const dto: XpLevelFormData = {
      name: name.trim(),
      minXp: parseInt(minXp),
      maxXp: maxXp ? parseInt(maxXp) : undefined,
    };

    if (!initialData) {
      dto.level = parseInt(level);
    }

    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <Input
          type="number"
          label="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          error={errors.level}
          placeholder="1"
          min="1"
        />
      )}

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Level name (e.g., Beginner, Intermediate)"
      />

      <Input
        type="number"
        label="Min XP"
        value={minXp}
        onChange={(e) => setMinXp(e.target.value)}
        error={errors.minXp}
        placeholder="0"
        min="0"
      />

      <Input
        type="number"
        label="Max XP (leave empty for no limit)"
        value={maxXp}
        onChange={(e) => setMaxXp(e.target.value)}
        error={errors.maxXp}
        placeholder="Optional"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
