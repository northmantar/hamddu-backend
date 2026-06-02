'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useUsers, useUpdateUserRole } from '@/hooks/queries/use-users';
import { useToast } from '@/components/ui/toast';
import type { User } from '@/types';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useUsers({ page, limit: 10, search: search || undefined });
  const updateRole = useUpdateUserRole();
  const { addToast } = useToast();

  const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
    try {
      await updateRole.mutateAsync({ id: userId, role });
      addToast('Role updated successfully', 'success');
    } catch {
      addToast('Failed to update role', 'error');
    }
  };

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => (
        <div>
          <div className="font-medium">{user.email}</div>
          <div className="text-gray-500 text-xs">{user.nickname}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
          className="w-28"
        />
      ),
    },
    {
      key: 'xp',
      header: 'XP',
      render: (user: User) => <span className="font-mono">{user.xp.toLocaleString()}</span>,
    },
    {
      key: 'points',
      header: 'Points',
      render: (user: User) => <span className="font-mono">{user.points.toLocaleString()}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="w-64">
          <Input
            placeholder="Search by email or nickname..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={data?.data || []}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="No users found"
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
    </div>
  );
}
