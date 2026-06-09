# Hamddu API 명세

이 문서는 실제 구현된 API의 상세 명세입니다.

## Base URL

```
http://localhost:3000/api
```

---

## 인증 방식

인증이 필요한 모든 엔드포인트는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```
Authorization: Bearer <access_token>
```

| 토큰 | 유효 기간 | 전달 방식 |
| --- | --- | --- |
| `access_token` | 15분 | `Authorization: Bearer` 헤더 |
| `refresh_token` | 30일 | httpOnly 쿠키 (서버가 자동으로 설정/삭제) |

---

## 공통 에러 응답

모든 에러 응답은 아래 형식을 따릅니다.

```json
{
  "statusCode": 400,
  "errorMessage": "잘못된 요청입니다."
}
```

### 공통 에러 코드

| 상태 코드 | 의미 | errorMessage 예시 |
| --- | --- | --- |
| `400` | 잘못된 요청 (유효성 검사 실패) | "잘못된 요청입니다." |
| `401` | 인증 실패 (토큰 없음/만료/유효하지 않음) | "인증이 필요합니다." |
| `403` | 권한 없음 | "접근 권한이 없습니다." |
| `404` | 리소스 없음 | "리소스를 찾을 수 없습니다." |
| `409` | 충돌 (중복 등) | "이미 존재하는 값입니다." |
| `500` | 서버 내부 오류 | "서버 오류가 발생했습니다." |

---

## Enum 값 목록

### `platform`

| 값 | 설명 |
| --- | --- |
| `naver` | 네이버 |
| `google` | 구글 |

### `memberStatus`

| 값 | 설명 |
| --- | --- |
| `active` | 정상 계정 |
| `withdrawn` | 탈퇴한 계정 |

### `memberType`

| 값 | 설명 |
| --- | --- |
| `member` | 일반 회원 |
| `admin` | 관리자 |

### `age`

| 값 | 연령대 |
| --- | --- |
| `1418` | 14 – 18세 |
| `1924` | 19 – 24세 |
| `2529` | 25 – 29세 |
| `3034` | 30 – 34세 |
| `3539` | 35 – 39세 |
| `4049` | 40 – 49세 |
| `50+` | 50세 이상 |

### `gender`

| 값 | 설명 |
| --- | --- |
| `M` | 남성 |
| `F` | 여성 |

### `interests`

| 값 | 설명 |
| --- | --- |
| `crochet` | 코바늘 |
| `knitting` | 대바늘 |

### `ability`

| 값 | 설명 |
| --- | --- |
| `beginner` | 입문 |
| `intermediate` | 초급 |
| `advanced` | 중급 |
| `expert` | 고급 |

### `contentType`

| 값 | 설명 |
| --- | --- |
| `symbol` | 기법 튜토리얼 (기호 버튼 형태로 메인 화면 노출) |
| `free` | 무료 도안 |
| `normal` | 일반 콘텐츠 |

### `boardStatus`

| 값 | 설명 |
| --- | --- |
| `draft` | 임시저장 |
| `published` | 게시됨 |
| `deleted` | 삭제됨 |

### `pointTransactionType`

| 값 | 설명 |
| --- | --- |
| `EARN` | 적립 |
| `USE` | 사용 |
| `CANCEL` | 취소 |

### `pointActionType`

| 값 | 설명 |
| --- | --- |
| `WATCH` | 콘텐츠 시청 |
| `CHALLENGE` | 챌린지 완료 |
| `COMMENT` | 댓글 작성 |

### `reportReason`

| 값 | 설명 |
| --- | --- |
| `spam` | 스팸/광고 |
| `harassment` | 욕설/비방 |
| `inappropriate` | 부적절한 콘텐츠 |
| `copyright` | 저작권 침해 |
| `other` | 기타 |

### `reportStatus`

| 값 | 설명 |
| --- | --- |
| `pending` | 대기 |
| `resolved` | 처리 완료 |
| `rejected` | 기각 |

---

# API 엔드포인트 목차

각 API의 상세 명세는 개별 문서를 참고하세요.

| # | 분류 | 문서 |
| --- | --- | --- |
| 1 | SNS 로그인 인증 API | [api/01-auth.md](api/01-auth.md) |
| 2 | 유저 관련 API | [api/02-users.md](api/02-users.md) |
| 3 | 닉네임 API | [api/03-nicknames.md](api/03-nicknames.md) |
| 4 | 게시판 API | [api/04-boards.md](api/04-boards.md) |
| 5 | 댓글 API | [api/05-comments.md](api/05-comments.md) |
| 6 | 콘텐츠 API | [api/06-contents.md](api/06-contents.md) |
| 7 | 시청 기록 API | [api/07-watch-history.md](api/07-watch-history.md) |
| 8 | 챌린지 API | [api/08-challenges.md](api/08-challenges.md) |
| 9 | 포인트 API | [api/09-points.md](api/09-points.md) |
| 10 | XP API | [api/10-xp.md](api/10-xp.md) |
| 11 | 어드민 인증 API | [api/11-admin-auth.md](api/11-admin-auth.md) |
| 12 | 유저 관리 API (관리자 전용) | [api/12-admin-users.md](api/12-admin-users.md) |
| 13 | 게시판 카테고리 관리 API (관리자 전용) | [api/13-admin-categories.md](api/13-admin-categories.md) |
| 14 | 신고 관리 API (관리자 전용) | [api/14-admin-reports.md](api/14-admin-reports.md) |
| 15 | 포인트 정책 관리 API (관리자 전용) | [api/15-admin-point-policies.md](api/15-admin-point-policies.md) |
| 16 | XP 레벨 정책 관리 API (관리자 전용) | [api/16-admin-xp-policies.md](api/16-admin-xp-policies.md) |
| 17 | 채널 API | [api/17-channels.md](api/17-channels.md) |
| 18 | 미디어 API | [api/18-media.md](api/18-media.md) |

---

# API 요약표

| 분류 | Method | Endpoint | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| **인증** | GET | /auth/google | - | 구글 로그인 시작 |
|  | GET | /auth/google/callback | - | 구글 OAuth 콜백 |
|  | GET | /auth/naver | - | 네이버 로그인 시작 |
|  | GET | /auth/naver/callback | - | 네이버 OAuth 콜백 |
|  | POST | /auth/refresh | - | 토큰 재발급 |
|  | POST | /auth/logout | - | 로그아웃 |
| **유저** | GET | /users/me | 인증 | 내 프로필 조회 |
|  | PATCH | /users/me | 인증 | 닉네임 수정 |
|  | POST | /users/me/survey | 인증 | 설문 제출 |
|  | DELETE | /users/me | 인증 | 회원 탈퇴 |
|  | GET | /users/:id | 관리자 | 특정 유저 조회 |
|  | GET | /users | 관리자 | 유저 목록 조회 |
| **닉네임** | GET | /nicknames/check | 인증 | 중복 체크 |
|  | GET | /nicknames/candidates | 인증 | 후보 목록 조회 |
|  | POST | /nicknames/issue | 인증 | 자동 발급 |
|  | POST | /nicknames/register | 인증 | 수동 등록 |
| **게시판** | GET | /boards | 인증 | 게시글 목록 |
|  | GET | /boards/categories | 인증 | 카테고리 목록 |
|  | GET | /boards/:id | 인증 | 게시글 상세 |
|  | POST | /boards | 인증 | 게시글 작성 |
|  | PATCH | /boards/:id | 작성자/관리자 | 게시글 수정 |
|  | DELETE | /boards/:id | 작성자/관리자 | 게시글 삭제 |
|  | POST | /boards/:id/like | 인증 | 좋아요 |
|  | DELETE | /boards/:id/like | 인증 | 좋아요 취소 |
|  | POST | /boards/:id/report | 인증 | 게시글 신고 |
| **댓글** | GET | /boards/:boardId/comments | 인증 | 댓글 목록 (스레드 형식) |
|  | POST | /boards/:boardId/comments | 인증 | 댓글/대댓글 작성 |
|  | PATCH | /boards/:boardId/comments/:commentId | 작성자/관리자 | 댓글 수정 |
|  | DELETE | /boards/:boardId/comments/:commentId | 작성자/관리자 | 댓글 삭제 |
|  | POST | /boards/:boardId/comments/:commentId/like | 인증 | 댓글 좋아요 |
|  | DELETE | /boards/:boardId/comments/:commentId/like | 인증 | 댓글 좋아요 취소 |
|  | POST | /boards/:boardId/comments/:commentId/report | 인증 | 댓글 신고 |
| **콘텐츠** | GET | /contents | 인증 | 콘텐츠 목록 |
|  | GET | /contents/tutorials | 인증 | 튜토리얼 목록 (순서별) |
|  | GET | /contents/:id | 인증 | 콘텐츠 상세 |
|  | POST | /contents | 관리자 | 콘텐츠 등록 |
|  | PATCH | /contents/:id | 관리자 | 콘텐츠 수정 |
|  | PATCH | /contents/:id/order | 관리자 | 콘텐츠 순서 변경 |
|  | DELETE | /contents/:id | 관리자 | 콘텐츠 삭제 |
| **시청 기록** | GET | /watch-history | 인증 | 시청 기록 목록 |
|  | POST | /watch-history | 인증 | 시청 기록 저장 |
| **챌린지** | GET | /challenges | 인증 | 챌린지 목록 |
|  | GET | /challenges/my | 인증 | 내 챌린지 목록 |
|  | GET | /challenges/:id | 인증 | 챌린지 상세 |
|  | POST | /challenges | 인증 | 챌린지 등록 |
| **포인트** | GET | /points/wallet | 인증 | 포인트 지갑 조회 |
|  | GET | /points/transactions | 인증 | 거래 내역 조회 |
|  | POST | /points/earn | 관리자 | 포인트 지급 |
|  | GET | /points/policies | 관리자 | 정책 목록 |
| **XP** | GET | /xp/wallet | 인증 | XP 지갑 조회 |
|  | GET | /xp/transactions | 인증 | 거래 내역 조회 |
|  | POST | /xp/earn | 관리자 | XP 지급 |
|  | GET | /xp/levels | 인증 | 레벨 정책 목록 |
| **어드민 인증** | POST | /auth/admin/login | - | 어드민 로그인 |
|  | POST | /auth/admin/set-password | 어드민 | 비밀번호 최초 설정 |
|  | PATCH | /auth/admin/change-password | 어드민 | 비밀번호 변경 |
| **유저 관리** | POST | /users | 관리자 | 유저 생성 |
|  | GET | /users | 관리자 | 유저 목록 |
|  | PATCH | /users/:id/role | 관리자 | 유저 역할 변경 |
| **카테고리 관리** | POST | /boards/categories | 관리자 | 카테고리 생성 |
|  | PATCH | /boards/categories/:categoryId | 관리자 | 카테고리 수정 |
|  | DELETE | /boards/categories/:categoryId | 관리자 | 카테고리 삭제 |
| **신고 관리** | GET | /boards/admin/reports | 관리자 | 전체 게시글 신고 목록 |
|  | GET | /boards/admin/:boardId/reports | 관리자 | 게시글별 신고 목록 |
|  | PATCH | /boards/admin/reports/:reportId | 관리자 | 게시글 신고 처리 |
|  | GET | /boards/admin/comment-reports | 관리자 | 전체 댓글 신고 목록 |
|  | GET | /boards/admin/comments/:commentId/reports | 관리자 | 댓글별 신고 목록 |
|  | PATCH | /boards/admin/comment-reports/:reportId | 관리자 | 댓글 신고 처리 |
| **포인트 정책** | POST | /points/policies | 관리자 | 정책 생성 |
|  | PATCH | /points/policies/:id | 관리자 | 정책 수정 |
|  | DELETE | /points/policies/:id | 관리자 | 정책 삭제 |
| **XP 정책** | POST | /xp/levels | 관리자 | 레벨 정책 생성 |
|  | PATCH | /xp/levels/:id | 관리자 | 레벨 정책 수정 |
|  | DELETE | /xp/levels/:id | 관리자 | 레벨 정책 삭제 |
| **채널** | GET | /channels | 인증 | 채널 목록 |
|  | POST | /channels | 관리자 | 채널 등록 |
|  | PATCH | /channels/:id | 관리자 | 채널 수정 |
|  | DELETE | /channels/:id | 관리자 | 채널 삭제 |
| **미디어** | POST | /media/upload | 인증 | 이미지 업로드 |
