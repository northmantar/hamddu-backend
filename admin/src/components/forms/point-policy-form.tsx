'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { PointPolicy } from '@/types';

interface PointPolicyFormData {
  eventType?: string;
  name: string;
  description?: string;
  points: number;
  isActive: boolean;
}

interface PointPolicyFormProps {
  initialData?: PointPolicy;
  onSubmit: (dto: PointPolicyFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

const EVENT_TYPES = [
  'post_create',
  'post_like',
  'comment_create',
  'comment_like',
  'daily_login',
  'signup_bonus',
];

export function PointPolicyForm({ initialData, onSubmit, isLoading, onCancel }: PointPolicyFormProps) {
  const [eventType, setEventType] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setEventType(initialData.eventType ?? initialData.actionType ?? '');
      setName(initialData.name ?? '');
      setDescription(initialData.description || '');
      setPoints(String(initialData.points ?? initialData.pointAmount ?? 0));
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!initialData && !eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!points || isNaN(parseInt(points))) {
      newErrors.points = 'Points must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const dto: PointPolicyFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      points: parseInt(points),
      isActive,
    };

    if (!initialData) {
      dto.eventType = eventType;
    }

    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialData && (
        <Select
          label="Event Type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          error={errors.eventType}
          placeholder="Select event type"
          options={EVENT_TYPES.map((type) => ({
            value: type,
            label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          }))}
        />
      )}

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Policy name"
      />

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description"
      />

      <Input
        type="number"
        label="Points"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        error={errors.points}
        placeholder="Points to award (can be negative)"
      />

      <Select
        label="Status"
        value={isActive ? 'true' : 'false'}
        onChange={(e) => setIsActive(e.target.value === 'true')}
        options={[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]}
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
