'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

const CONTENTS_ICON = 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
const REPORTS_ICON = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';

const topMenuItems = [
  { href: '/users', label: '유저 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/channels', label: '채널 관리', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
];

const contentsSubItems = [
  { href: '/contents/tutorials', label: '튜토리얼 콘텐츠' },
  { href: '/contents/general', label: '일반 콘텐츠' },
];

const reportsSubItems = [
  { href: '/reports/boards', label: '게시글 신고 관리' },
  { href: '/reports/comments', label: '댓글 신고 관리' },
];

const bottomMenuItems = [
  { href: '/categories', label: '카테고리 관리', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/points', label: '포인트 정책', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/xp', label: 'XP 레벨', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/password', label: '비밀번호 변경', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isContentsActive = pathname.startsWith('/contents');
  const isReportsActive = pathname.startsWith('/reports');
  const [contentsOpen, setContentsOpen] = useState(isContentsActive);
  const [reportsOpen, setReportsOpen] = useState(isReportsActive);

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Hamddu Admin</h1>
        {user && (
          <p className="text-sm text-gray-400 mt-1">{user.email}</p>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {topMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}

          {/* 콘텐츠 관리 accordion */}
          <li>
            <button
              onClick={() => setContentsOpen((v) => !v)}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                isContentsActive ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CONTENTS_ICON} />
                </svg>
                콘텐츠 관리
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${contentsOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {contentsOpen && (
              <ul className="mt-1 ml-4 space-y-1">
                {contentsSubItems.map((sub) => {
                  const isActive = pathname === sub.href;
                  return (
                    <li key={sub.href}>
                      <Link
                        href={sub.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          {/* 신고 관리 accordion */}
          <li>
            <button
              onClick={() => setReportsOpen((v) => !v)}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                isReportsActive ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={REPORTS_ICON} />
                </svg>
                신고 관리
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {reportsOpen && (
              <ul className="mt-1 ml-4 space-y-1">
                {reportsSubItems.map((sub) => {
                  const isActive = pathname === sub.href;
                  return (
                    <li key={sub.href}>
                      <Link
                        href={sub.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
