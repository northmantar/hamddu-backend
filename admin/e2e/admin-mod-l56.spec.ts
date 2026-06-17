import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * 2차 개편 (admin-mod.md L56~) 화면 검증.
 * - 백엔드 없이 API를 mock 으로 채워서 신규 UI 동작만 확인.
 */

const TOKEN = 'mock-token';

const SEED_USER = {
  id: 'admin-user',
  email: 'admin@hamddu.com',
  type: 'admin',
  status: 'active',
  nickname: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const CATEGORIES = [
  { id: 'cat-1', label: '뜨개 결과물 자랑', status: 'enabled' },
  { id: 'cat-2', label: '뜨개 지식 공유', status: 'enabled' },
];

const POINT_ACTION_TYPES = [
  { code: 'WATCH', labelKo: '시청', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { code: 'CHALLENGE', labelKo: '챌린지', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { code: 'COMMENT', labelKo: '댓글', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const POINT_POLICIES = [
  {
    id: 'pp-1',
    actionType: 'WATCH',
    actionTypeLabelKo: '시청',
    pointAmount: 10,
    isOneTime: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const XP_ACTION_TYPES = [
  { code: 'SIGNUP', labelKo: '회원가입', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { code: 'DAILY_LOGIN', labelKo: '일일 로그인', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const XP_POLICIES = [
  {
    id: 'xp-pol-1',
    actionType: 'SIGNUP',
    actionTypeLabelKo: '회원가입',
    xpAmount: 100,
    isOneTime: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const XP_LEVELS = [
  { id: 'xl-1', level: 1, xpThreshold: 0, label: '새싹 뜨개러', isActive: true },
  { id: 'xl-2', level: 2, xpThreshold: 100, label: '초보 뜨개러', isActive: true },
];

const CHANNELS = [
  { id: 'ch-1', name: '테스트 채널', platform: 'youtube', sourceChannelId: 'UC_test', status: 'active', addedAt: '2026-01-01T00:00:00.000Z' },
];

const TUTORIALS = [
  {
    id: 'tut-1',
    channelId: 'ch-1',
    channel: { id: 'ch-1', name: '테스트 채널' },
    sourceVideoId: 'abc123',
    name: '코바늘 기초',
    type: 'symbol',
    status: 'active',
    interests: 'crochet',
    imageUrl: null,
    mediaId: null,
    pointApplyable: true,
    sortOrder: 1,
    uploadedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const BOARD_REPORTS = {
  data: [
    {
      id: 'br-1',
      reason: 'spam',
      description: '광고성 게시물',
      status: 'pending',
      createdAt: '2026-06-01T00:00:00.000Z',
      processedAt: null,
      reporter: { id: 'u1', nickname: '신고자' },
      board: { id: 'b1', title: '신고당한 게시글' },
    },
  ],
  meta: { totalCount: 1, page: 1, limit: 20, totalPages: 1 },
};

const COMMENT_REPORTS = {
  data: [
    {
      id: 'cr-1',
      reason: 'harassment',
      description: '욕설',
      status: 'pending',
      createdAt: '2026-06-01T00:00:00.000Z',
      processedAt: null,
      reporter: { id: 'u1', nickname: '신고자' },
      comment: { id: 'c1', body: '나쁜 말', boardId: 'b1' },
    },
  ],
  meta: { totalCount: 1, page: 1, limit: 20, totalPages: 1 },
};

function json(data: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(data) };
}

async function setupMocks(page: Page) {
  // localStorage 토큰 + user 세팅으로 dashboard 가드(isAuthenticated) 우회.
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: TOKEN, user: SEED_USER });

  await page.route('**/api/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    const path = url.split('/api')[1]?.split('?')[0] ?? '';

    // 인증/유저
    if (path === '/auth/admin/login' && method === 'POST') {
      return route.fulfill(json({ accessToken: TOKEN, refreshToken: TOKEN, user: SEED_USER }));
    }
    if (path === '/auth/refresh' && method === 'POST') {
      return route.fulfill(json({ accessToken: TOKEN, refreshToken: TOKEN }));
    }
    if (path === '/auth/me' && method === 'GET') {
      return route.fulfill(json(SEED_USER));
    }
    if (path === '/users' && method === 'GET') {
      return route.fulfill(json({ data: [SEED_USER], meta: { totalCount: 1, page: 1, limit: 20, totalPages: 1 } }));
    }

    // 카테고리
    if (path === '/boards/categories' && method === 'GET') {
      return route.fulfill(json({ data: CATEGORIES }));
    }
    if (path === '/boards/categories' && method === 'POST') {
      return route.fulfill(json({ id: 'cat-new', label: 'new', status: 'enabled' }, 201));
    }

    // 채널
    if (path === '/channels' && method === 'GET') {
      return route.fulfill(json(CHANNELS));
    }

    // 튜토리얼 — useTutorials는 /contents/tutorials 가 직접 배열을 반환한다고 가정
    if (path === '/contents/tutorials' && method === 'GET') {
      const q = new URL(url).searchParams;
      const interests = q.get('interests');
      const data = interests ? TUTORIALS.filter((t) => t.interests === interests) : TUTORIALS;
      return route.fulfill(json(data));
    }
    // 일반 콘텐츠 목록
    if (path === '/contents' && method === 'GET') {
      const q = new URL(url).searchParams;
      const type = q.get('type');
      const data = type ? TUTORIALS.filter((t) => t.type === type) : TUTORIALS;
      return route.fulfill(json({ data, meta: { totalCount: data.length, page: 1, limit: 20, totalPages: 1 } }));
    }

    // 포인트
    if (path === '/points/policies' && method === 'GET') {
      return route.fulfill(json({ data: POINT_POLICIES }));
    }
    if (path === '/points/action-types' && method === 'GET') {
      return route.fulfill(json({ data: POINT_ACTION_TYPES }));
    }
    if (path === '/points/action-types' && method === 'POST') {
      const body = await route.request().postDataJSON();
      return route.fulfill(json({ ...body, isActive: true, createdAt: '', updatedAt: '' }, 201));
    }

    // XP
    if (path === '/xp/levels' && method === 'GET') {
      return route.fulfill(json({ data: XP_LEVELS }));
    }
    if (path === '/xp/policies' && method === 'GET') {
      return route.fulfill(json({ data: XP_POLICIES }));
    }
    if (path === '/xp/action-types' && method === 'GET') {
      return route.fulfill(json({ data: XP_ACTION_TYPES }));
    }

    // 신고
    if (path === '/boards/admin/reports' && method === 'GET') {
      return route.fulfill(json(BOARD_REPORTS));
    }
    if (path === '/boards/admin/comment-reports' && method === 'GET') {
      return route.fulfill(json(COMMENT_REPORTS));
    }

    // 그 외는 빈 응답
    return route.fulfill(json({ data: [], meta: { totalCount: 0, page: 1, limit: 20, totalPages: 0 } }));
  });
}

test.describe('admin-mod L56~ 2차 개편 화면', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  // ── 신고 페이지 드롭다운 폭 ──────────────────────────────────────────
  test('게시글 신고 페이지의 상태 드롭다운은 w-auto', async ({ page }) => {
    await page.goto('/reports/boards');
    await page.waitForLoadState('networkidle');
    // 헤더(필터) 영역의 첫 select — table 행마다 있는 status select는 제외
    const select = page.locator('main select').first();
    await expect(select).toHaveClass(/w-auto/);
  });

  test('댓글 신고 페이지의 상태 드롭다운도 w-auto', async ({ page }) => {
    await page.goto('/reports/comments');
    await page.waitForLoadState('networkidle');
    const select = page.locator('main select').first();
    await expect(select).toHaveClass(/w-auto/);
  });

  // ── 카테고리 한글화 / slug·sortOrder 제거 ─────────────────────────
  test('카테고리 페이지: 한글 컬럼만 노출, slug/sort order 제거', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '카테고리 관리' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '이름' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '작업' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /sort order/i })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Slug' })).toHaveCount(0);
  });

  test('카테고리 추가 모달: slug/sort order input 없음', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '카테고리 추가' }).click();
    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('이름')).toBeVisible();
    await expect(dialog.getByLabel(/slug/i)).toHaveCount(0);
    await expect(dialog.getByLabel(/sort/i)).toHaveCount(0);
  });

  // ── 튜토리얼 아이콘 컬럼 + 업로드 ─────────────────────────────────
  test('튜토리얼: 아이콘 컬럼 + ImageUpload 모달', async ({ page }) => {
    await page.goto('/contents/tutorials');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('columnheader', { name: '아이콘' })).toBeVisible();
    await page.getByRole('button', { name: '튜토리얼 추가' }).click();
    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(dialog).toBeVisible();
    // ImageUpload 컴포넌트는 file input + 안내 UI를 가짐
    await expect(dialog.locator('input[type="file"]')).toBeAttached();
  });

  // ── 포인트 정책: 탭 2개 (지급 정책 / 액션 타입 관리) ────────────────
  test('포인트 정책 페이지: 탭 2개', async ({ page }) => {
    await page.goto('/points');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '포인트 정책' })).toBeVisible();
    await expect(page.getByRole('button', { name: '지급 정책' })).toBeVisible();
    await expect(page.getByRole('button', { name: '액션 타입 관리' })).toBeVisible();
  });

  test('포인트: 액션 타입 탭으로 전환 시 시드 데이터 노출', async ({ page }) => {
    await page.goto('/points');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '액션 타입 관리' }).click();
    await expect(page.getByText('WATCH').first()).toBeVisible();
    await expect(page.getByText('시청').first()).toBeVisible();
    await expect(page.getByText('CHALLENGE').first()).toBeVisible();
    await expect(page.getByText('챌린지').first()).toBeVisible();
  });

  test('포인트: 정책 추가 모달에 동적 액션 타입 옵션 (한글 라벨 포함)', async ({ page }) => {
    await page.goto('/points');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '정책 추가' }).click();
    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(dialog).toBeVisible();
    const select = dialog.locator('select').first();
    // 옵션에 lookup 값들이 들어있어야 함
    await expect(select).toContainText('시청');
    await expect(select).toContainText('챌린지');
    await expect(select).toContainText('댓글');
  });

  // ── XP 정책: /xp/policies (탭 2개), /xp/levels ───────────────────────
  test('XP 지급 정책 페이지: 탭 2개', async ({ page }) => {
    await page.goto('/xp/policies');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'XP 지급 정책' })).toBeVisible();
    await expect(page.getByRole('button', { name: '지급 정책' })).toBeVisible();
    await expect(page.getByRole('button', { name: '액션 타입 관리' })).toBeVisible();
  });

  test('XP 액션 타입 탭: SIGNUP/DAILY_LOGIN 노출', async ({ page }) => {
    await page.goto('/xp/policies');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '액션 타입 관리' }).click();
    await expect(page.getByText('SIGNUP').first()).toBeVisible();
    await expect(page.getByText('회원가입').first()).toBeVisible();
  });

  test('누적 XP 레벨 페이지: XP 임계값 컬럼만 (Min/Max XP 없음)', async ({ page }) => {
    await page.goto('/xp/levels');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '누적 XP 레벨' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'XP 임계값' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /min xp/i })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: /max xp/i })).toHaveCount(0);
  });

  test('XP 레벨 추가 모달: XP 임계값 단일 필드만 노출', async ({ page }) => {
    await page.goto('/xp/levels');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '레벨 추가' }).click();
    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('XP 임계값')).toBeVisible();
    await expect(dialog.getByLabel(/min xp/i)).toHaveCount(0);
    await expect(dialog.getByLabel(/max xp/i)).toHaveCount(0);
  });

  // ── 사이드바: XP 정책 accordion ─────────────────────────────────────
  test('사이드바: XP 정책 accordion 2개 sub item', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /XP 정책/ }).click();
    await expect(sidebar.getByRole('link', { name: 'XP 지급 정책' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: '누적 XP 레벨' })).toBeVisible();
  });

  test('사이드바: 기존 단일 /xp 링크는 더 이상 없음', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    // sub 링크는 accordion 열어야 DOM에 나옴
    await page.locator('aside').getByRole('button', { name: /XP 정책/ }).click();
    await expect(page.locator('aside a[href="/xp"]')).toHaveCount(0);
    await expect(page.locator('aside a[href="/xp/policies"]')).toHaveCount(1);
    await expect(page.locator('aside a[href="/xp/levels"]')).toHaveCount(1);
  });
});
