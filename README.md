# 함뜨 (Hamddu) — 백엔드

코바늘·대바늘 뜨개 SNS 플랫폼 **함뜨**의 API 서버입니다.

---

## 서비스 소개

**함뜨**는 뜨개질을 시작하는 입문자부터 숙련자까지, 뜨개 콘텐츠를 통해 배우고 성장하며 서로의 작품을 나눌 수 있는 SNS 플랫폼입니다.

유튜브에 흩어져 있는 뜨개 튜토리얼 영상을 체계적으로 큐레이션하고, 시청 후 직접 만든 작품을 인증하는 챌린지 기능을 통해 학습 동기를 부여합니다. 커뮤니티 게시판에서는 재료·패턴·팁 등을 자유롭게 공유할 수 있으며, 포인트·경험치 시스템을 통해 활동할수록 성장하는 경험을 제공합니다.

---
## 주요 기능

### 뜨개 콘텐츠
유튜브 채널과 연동하여 **기법 튜토리얼**과 **무료 도안** 영상을 제공합니다. 기법 튜토리얼은 단계별로 연결된 구조로 구성되어, 입문자가 순서대로 따라갈 수 있습니다. 시청 진행률과 마지막 시청 타임스탬프를 추적하여 이어보기를 지원합니다.

### 챌린지
튜토리얼 영상을 시청한 뒤 완성한 작품 사진을 올려 인증하는 기능입니다. 챌린지를 완료하면 포인트와 경험치가 지급됩니다.

### 커뮤니티 게시판
카테고리별로 게시글을 작성하고 댓글과 좋아요를 남길 수 있는 커뮤니티 공간입니다. 게시글·댓글 작성 시 포인트가 적립되며, 게시글과 댓글은 논리 삭제로 처리됩니다.

### 포인트 시스템
콘텐츠 시청, 챌린지 완료, 댓글 작성 등 플랫폼 내 활동에 따라 포인트가 적립됩니다. 적립 정책은 관리자가 유연하게 설정할 수 있으며, 포인트 사용 내역은 적립 트랜잭션과의 M:N 관계로 정밀하게 추적됩니다.

### 경험치 & 레벨
활동을 통해 경험치(XP)를 쌓고 레벨을 올릴 수 있습니다. 레벨 달성 기준은 정책 테이블로 관리되어, 기준 조정이 유연합니다.

### 채팅 *(개발 예정)*
회원 간 1:1 채팅 및 그룹 채팅을 지원할 예정입니다. 채팅 데이터는 MongoDB에 저장됩니다.

---

## 기술 스택

| 분류 | 사용 기술 |
|---|---|
| 런타임 | Node.js + TypeScript |
| 프레임워크 | NestJS |
| 데이터베이스 | PostgreSQL (TypeORM) |
| 캐시 / 세션 | Redis (ioredis) |
| 인증 | JWT + Google OAuth 2.0 + Naver OAuth |
| 시크릿 관리 | Infisical (self-hosted) |
| 프로세스 관리 | PM2 |

---

## 프로젝트 구조

```
src/
├── entities/          # TypeORM 엔티티
├── enums/             # 공용 enum 정의
├── infisical/         # Infisical 시크릿 로더
├── auth/              # 인증 (JWT, Google, Naver OAuth)
│   ├── guards/
│   ├── strategies/
│   └── interfaces/
├── users/             # 유저 도메인
│   └── dto/
├── redis/             # Redis 클라이언트
├── common/            # 공용 데코레이터
├── app.module.ts
├── main.ts
└── data-source.ts     # TypeORM CLI용 DataSource
```

---

## 도메인 구조 (ERD 요약)

```
member ─── watch_history ─── content ─── channel
  │
  ├── board ─── board_comment
  │     └── board_like
  │
  ├── challenge ─── content
  │
  ├── point_wallet
  ├── point_transaction ─── point_earning_policy
  │     └── point_use_detail
  │
  └── xp_wallet ─── xp_level_policy
        └── xp_transaction
```

| 도메인 | 설명 |
|---|---|
| **member** | 회원 정보, OAuth 로그인, 설문 데이터 |
| **channel / content** | 연동된 유튜브 채널 및 콘텐츠 |
| **watch_history** | 콘텐츠 시청 기록 |
| **challenge** | 콘텐츠 기반 챌린지 게시물 |
| **board** | 커뮤니티 게시판 (글·댓글·좋아요) |
| **point** | 포인트 적립 정책, 지갑, 거래 내역 |
| **xp** | 경험치 레벨 정책, 지갑, 거래 내역 |

---

## 시작하기

### 사전 요구 사항

- Node.js 20+
- PostgreSQL
- Redis
- Infisical (self-hosted)
- PM2 (`npm install -g pm2`)

### 환경 변수 설정

`.env.example`을 참고해 `.env` 파일을 생성합니다.  
Infisical 연결 정보만 로컬에 두고, 나머지 시크릿(`DB_*`, `JWT_SECRET`, `GOOGLE_*` 등)은 모두 Infisical에서 관리합니다.

```bash
cp .env.example .env
# .env에 INFISICAL_SITE_URL, INFISICAL_PROJECT_ID, INFISICAL_ENVIRONMENT,
# INFISICAL_ACCESS_TOKEN (또는 INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET) 입력
```

### 개발 서버 실행

```bash
npm install
npm run start:dev
```

### 프로덕션 실행 (PM2)

```bash
npm run build
pm2 start ecosystem.config.js
```

---

## 주요 명령어

| 명령어 | 설명 |
|---|---|
| `npm run start:dev` | 개발 서버 (watch 모드) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start:prod` | 빌드 결과물 직접 실행 |
| `pm2 start ecosystem.config.js` | PM2로 프로덕션 실행 |
| `pm2 logs hamddu-backend` | 실시간 로그 확인 |
| `pm2 restart hamddu-backend` | 서버 재시작 |

---

## 인증 흐름

1. 클라이언트가 `GET /api/auth/google` (또는 `/naver`)로 이동
2. OAuth 완료 후 서버가 프론트엔드로 리다이렉트
   ```
   {FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
   ```
3. `access_token` (유효기간 15분)은 메모리에 저장, `refresh_token` (유효기간 30일)은 httpOnly 쿠키로 자동 관리
4. 토큰 만료 시 `POST /api/auth/refresh` 호출

자세한 API 명세는 [API.md](./API.md)를 참고하세요.

---

## 시크릿 관리

앱 기동 시 Infisical에서 시크릿을 일괄 조회해 `ConfigService`에 주입합니다.  
별도의 코드 변경 없이 기존 `config.get('DB_HOST')` 방식 그대로 사용 가능합니다.

```
.env (로컬/서버 환경변수)
  └── INFISICAL_* (연결 정보만)
        └── Infisical → DB_*, JWT_*, GOOGLE_*, NAVER_*, REDIS_*, ...
```
