'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { useUsers, useUpdateUserRole, useCreateUser } from '@/hooks/queries/use-users';
import { useToast } from '@/components/ui/toast';
import type { User } from '@/types';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newType, setNewType] = useState<'member' | 'admin'>('member');
  const { data, isLoading } = useUsers({ page, limit: 10, search: search || undefined });
  const updateRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const { addToast } = useToast();

  const handleRoleChange = async (userId: string, role: 'member' | 'admin') => {
    try {
      await updateRole.mutateAsync({ id: userId, role });
      addToast('Role updated successfully', 'success');
    } catch {
      addToast('Failed to update role', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    try {
      await createUser.mutateAsync({ email: newEmail, password: newPassword, type: newType });
      addToast('User created successfully', 'success');
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewType('member');
    } catch {
      addToast('Failed to create user', 'error');
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
          value={user.type ?? user.role ?? 'member'}
          onChange={(e) => handleRoleChange(user.id, e.target.value as 'member' | 'admin')}
          options={[
            { value: 'member', label: 'Member' },
            { value: 'admin', label: 'Admin' },
          ]}
          className="w-28"
        />
      ),
    },
    {
      key: 'xp',
      header: 'XP',
      render: (user: User) => <span className="font-mono">{(user.xp ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'points',
      header: 'Points',
      render: (user: User) => <span className="font-mono">{(user.points ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (user: User) => user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
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
          <Button onClick={() => setIsModalOpen(true)}>Add User</Button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />
          <Select
            label="Role"
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'member' | 'admin')}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createUser.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
