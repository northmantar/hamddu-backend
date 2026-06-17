'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries/use-categories';
import { useToast } from '@/components/ui/toast';
import { CategoryForm } from '@/components/forms/category-form';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

interface CategoryFormData {
  label: string;
  status?: 'enabled' | 'disabled';
}

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { addToast } = useToast();

  const handleCreate = async (dto: CategoryFormData) => {
    try {
      await createCategory.mutateAsync({ label: dto.label } as CreateCategoryDto);
      addToast('카테고리가 추가되었습니다.', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('카테고리 추가에 실패했습니다.', 'error');
    }
  };

  const handleUpdate = async (dto: CategoryFormData) => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync({ id: editingCategory.id, dto: dto as UpdateCategoryDto });
      addToast('카테고리가 수정되었습니다.', 'success');
      setEditingCategory(null);
    } catch {
      addToast('카테고리 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    try {
      await deleteCategory.mutateAsync(id);
      addToast('카테고리가 삭제되었습니다.', 'success');
    } catch {
      addToast('카테고리 삭제에 실패했습니다.', 'error');
    }
  };

  const columns = [
    {
      key: 'label',
      header: '이름',
      render: (category: Category) => (
        <span className="font-medium">{category.label ?? category.name}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (category: Category) => (
        <Badge variant={category.status === 'disabled' ? 'warning' : 'success'}>
          {category.status === 'disabled' ? '비활성' : '활성'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (category: Category) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditingCategory(category)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(category.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
        <Button onClick={() => setIsModalOpen(true)}>카테고리 추가</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={categories || []}
          keyExtractor={(category) => category.id}
          isLoading={isLoading}
          emptyMessage="등록된 카테고리가 없습니다."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="카테고리 추가"
      >
        <CategoryForm
          onSubmit={handleCreate}
          isLoading={createCategory.isPending}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="카테고리 수정"
      >
        {editingCategory && (
          <CategoryForm
            initialData={editingCategory}
            onSubmit={handleUpdate}
            isLoading={updateCategory.isPending}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </Modal>
    </div>
  );
}
