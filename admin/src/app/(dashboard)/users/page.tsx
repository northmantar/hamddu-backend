'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import {
  useUsers,
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteAdminUser,
  useResetAdminPassword,
} from '@/hooks/queries/use-users';
import { useToast } from '@/components/ui/toast';
import type { User, UserStatus, UserType } from '@/types';

type Tab = 'admin' | 'member';

const STATUS_LABELS: Record<UserStatus, string> = { active: '활성', withdrawn: '탈퇴' };
const ROLE_LABELS: Record<UserType, string> = { admin: '관리자', member: '회원' };

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('admin');
  const [page, setPage] = useState(1);

  // 어드민 탭 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  // 비밀번호 초기화 모달
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const { addToast } = useToast();

  const { data, isLoading } = useUsers({ page, limit: 15, type: activeTab });
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteAdmin = useDeleteAdminUser();
  const resetAdminPassword = useResetAdminPassword();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleRoleChange = async (user: User, type: UserType) => {
    try {
      await updateRole.mutateAsync({ id: user.id, type });
      addToast('역할이 변경되었습니다.', 'success');
    } catch {
      addToast('역할 변경에 실패했습니다.', 'error');
    }
  };

  const handleStatusChange = async (user: User, status: UserStatus) => {
    try {
      await updateStatus.mutateAsync({ id: user.id, status });
      addToast('상태가 변경되었습니다.', 'success');
    } catch {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.email} 계정을 삭제하시겠습니까?`)) return;
    try {
      await deleteAdmin.mutateAsync(user.id);
      addToast('삭제되었습니다.', 'success');
    } catch {
      addToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword) return;
    try {
      await createUser.mutateAsync({ email: createEmail, password: createPassword, type: 'admin' });
      addToast('어드민 유저가 생성되었습니다.', 'success');
      setIsCreateModalOpen(false);
      setCreateEmail('');
      setCreatePassword('');
    } catch {
      addToast('생성에 실패했습니다.', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !resetPassword) return;
    try {
      await resetAdminPassword.mutateAsync({ id: resetTarget.id, newPassword: resetPassword });
      addToast('비밀번호가 초기화되었습니다.', 'success');
      setResetTarget(null);
      setResetPassword('');
    } catch {
      addToast('비밀번호 초기화에 실패했습니다.', 'error');
    }
  };

  const adminColumns = [
    {
      key: 'email',
      header: '이메일',
      render: (user: User) => <span className="font-medium">{user.email ?? '-'}</span>,
    },
    {
      key: 'type',
      header: '역할',
      render: (user: User) => (
        <Select
          value={user.type}
          onChange={(e) => handleRoleChange(user, e.target.value as UserType)}
          options={[
            { value: 'admin', label: ROLE_LABELS.admin },
            { value: 'member', label: ROLE_LABELS.member },
          ]}
          className="w-28"
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (user: User) => (
        <Select
          value={user.status}
          onChange={(e) => handleStatusChange(user, e.target.value as UserStatus)}
          options={[
            { value: 'active', label: STATUS_LABELS.active },
            { value: 'withdrawn', label: STATUS_LABELS.withdrawn },
          ]}
          className="w-24"
        />
      ),
    },
    {
      key: 'createdAt',
      header: '가입일자',
      render: (user: User) => new Date(user.createdAt).toLocaleDateString('ko-KR'),
    },
    {
      key: 'actions',
      header: '관리',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setResetTarget(user)}>
            비밀번호 초기화
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(user)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const memberColumns = [
    {
      key: 'nickname',
      header: '닉네임',
      render: (user: User) => <span className="font-medium">{user.nickname ?? '-'}</span>,
    },
    {
      key: 'email',
      header: '이메일',
      render: (user: User) => user.email ? <span className="text-sm">{user.email}</span> : null,
    },
    {
      key: 'xp',
      header: 'XP',
      render: (user: User) => <span className="font-mono">{(user.xp ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'points',
      header: '포인트',
      render: (user: User) => <span className="font-mono">{(user.points ?? 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: '상태',
      render: (user: User) => (
        <Select
          value={user.status}
          onChange={(e) => handleStatusChange(user, e.target.value as UserStatus)}
          options={[
            { value: 'active', label: STATUS_LABELS.active },
            { value: 'withdrawn', label: STATUS_LABELS.withdrawn },
          ]}
          className="w-24"
        />
      ),
    },
    {
      key: 'createdAt',
      header: '가입일자',
      render: (user: User) => new Date(user.createdAt).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">유저 관리</h1>
        {activeTab === 'admin' && (
          <Button onClick={() => setIsCreateModalOpen(true)}>유저 추가</Button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['admin', 'member'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'admin' ? '어드민 유저' : '서비스 회원'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={activeTab === 'admin' ? adminColumns : memberColumns}
          data={data?.data || []}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="유저가 없습니다."
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

      {/* 어드민 유저 생성 모달 */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="유저 추가">
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
          <Input
            label="비밀번호"
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            placeholder="최소 8자, 영문+숫자 필수"
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              취소
            </Button>
            <Button type="submit" isLoading={createUser.isPending}>
              추가
            </Button>
          </div>
        </form>
      </Modal>

      {/* 비밀번호 초기화 모달 */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => { setResetTarget(null); setResetPassword(''); }}
        title="비밀번호 초기화"
      >
        {resetTarget && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{resetTarget.email}</span> 계정의 비밀번호를 초기화합니다.
            </p>
            <Input
              label="새 비밀번호"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="최소 8자, 영문+숫자 필수"
              required
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => { setResetTarget(null); setResetPassword(''); }}>
                취소
              </Button>
              <Button type="submit" isLoading={resetAdminPassword.isPending}>
                초기화
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
