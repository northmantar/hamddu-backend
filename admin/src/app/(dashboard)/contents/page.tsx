'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useContents, useCreateContent, useDeleteContent } from '@/hooks/queries/use-contents';
import { useChannels } from '@/hooks/queries/use-channels';
import { useToast } from '@/components/ui/toast';
import { ContentForm } from '@/components/forms/content-form';
import type { Content, CreateContentDto } from '@/types';

export default function ContentsPage() {
  const [page, setPage] = useState(1);
  const [channelId, setChannelId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useContents({ page, limit: 10, channelId: channelId || undefined });
  const { data: channels } = useChannels();
  const createContent = useCreateContent();
  const deleteContent = useDeleteContent();
  const { addToast } = useToast();

  const handleCreate = async (dto: CreateContentDto) => {
    try {
      await createContent.mutateAsync(dto);
      addToast('Content created successfully', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('Failed to create content', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await deleteContent.mutateAsync(id);
      addToast('Content deleted successfully', 'success');
    } catch {
      addToast('Failed to delete content', 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Content',
      render: (content: Content) => (
        <div className="flex items-center gap-3">
          {content.imageUrl && (
            <img
              src={content.imageUrl}
              alt={content.name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div className="max-w-xs">
            <div className="font-medium truncate">{content.name}</div>
            <div className="text-gray-500 text-xs">{content.youtubeVideoId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (content: Content) => content.channel?.name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      render: (content: Content) => content.type,
    },
    {
      key: 'pointApplyable',
      header: 'Point',
      render: (content: Content) => content.pointApplyable ? '✓' : '-',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (content: Content) => new Date(content.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (content: Content) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDelete(content.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contents</h1>
        <div className="flex items-center gap-4">
          <Select
            value={channelId}
            onChange={(e) => {
              setChannelId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Channels' },
              ...(channels?.map((ch) => ({ value: ch.id, label: ch.name })) || []),
            ]}
            className="w-48"
          />
          <Button onClick={() => setIsModalOpen(true)}>Add Content</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={data?.data || []}
          keyExtractor={(content) => content.id}
          isLoading={isLoading}
          emptyMessage="No contents found"
        />

        {data?.meta && (
          <div className="px-6 py-4 border-t">
            <Pagination
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Content"
      >
        <ContentForm
          channels={channels || []}
          onSubmit={handleCreate}
          isLoading={createContent.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
