'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries/use-categories';
import { useToast } from '@/components/ui/toast';
import { CategoryForm } from '@/components/forms/category-form';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
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
      await createCategory.mutateAsync(dto as CreateCategoryDto);
      addToast('Category created successfully', 'success');
      setIsModalOpen(false);
    } catch {
      addToast('Failed to create category', 'error');
    }
  };

  const handleUpdate = async (dto: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await updateCategory.mutateAsync({ id: editingCategory.id, dto: dto as UpdateCategoryDto });
      addToast('Category updated successfully', 'success');
      setEditingCategory(null);
    } catch {
      addToast('Failed to update category', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory.mutateAsync(id);
      addToast('Category deleted successfully', 'success');
    } catch {
      addToast('Failed to delete category', 'error');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (category: Category) => (
        <div>
          <div className="font-medium">{category.label ?? category.name}</div>
          <div className="text-gray-500 text-xs">{category.slug ?? category.status}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (category: Category) => (
        <span className="text-gray-600">{category.description || '-'}</span>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      render: (category: Category) => category.sortOrder,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category: Category) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingCategory(category)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(category.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Category</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={categories || []}
          keyExtractor={(category) => category.id}
          isLoading={isLoading}
          emptyMessage="No categories found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Category"
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
        title="Edit Category"
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
