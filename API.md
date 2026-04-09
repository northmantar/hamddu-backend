# Hamddu API 명세서

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
|---|---|---|
| `access_token` | 15분 | `Authorization: Bearer` 헤더 |
| `refresh_token` | 7일 | httpOnly 쿠키 (서버가 자동으로 설정/삭제) |

액세스 토큰이 만료되면 `POST /auth/refresh`를 호출하여 새 토큰을 발급받습니다. 리프레시 토큰 쿠키는 브라우저가 자동으로 전송합니다.

---

## 공통 에러 응답

```json
{
  "statusCode": 400,
  "message": "에러 상세 내용",
  "error": "Bad Request"
}
```

| 상태 코드 | 의미 |
|---|---|
| `400` | 유효성 검사 실패 |
| `401` | 액세스 토큰 없음 또는 만료/유효하지 않음 |
| `403` | 인증은 됐으나 권한 없음 (예: 설문 미완료) |
| `409` | 충돌 (예: 닉네임 중복) |

---

## Enum 값 목록

### `platform`
| 값 | 설명 |
|---|---|
| `naver` | 네이버 |
| `google` | 구글 |

### `status`
| 값 | 설명 |
|---|---|
| `active` | 정상 계정 |
| `withdrawn` | 탈퇴한 계정 |

### `type`
| 값 | 설명 |
|---|---|
| `member` | 일반 회원 |
| `admin` | 관리자 |

### `age`
| 값 | 연령대 |
|---|---|
| `1518` | 15 – 18세 |
| `1924` | 19 – 24세 |
| `2529` | 25 – 29세 |
| `3034` | 30 – 34세 |
| `3539` | 35 – 39세 |
| `4049` | 40 – 49세 |
| `50+` | 50세 이상 |

---

## 유저 객체

`/users/*` 엔드포인트의 공통 응답 형태입니다.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "type": "member",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

| 필드 | 타입 | Nullable | 설명 |
|---|---|---|---|
| `id` | string (UUID) | No | 유저 ID |
| `status` | string (enum) | No | 계정 상태 |
| `type` | string (enum) | No | 유저 유형 |
| `platform` | string (enum) | Yes | 가입 플랫폼 |
| `email` | string | Yes | OAuth 제공자로부터 받은 이메일 |
| `name` | string | Yes | OAuth 제공자로부터 받은 이름 |
| `nickname` | string | Yes | 유저가 설정한 닉네임, 설정 전 null |
| `age` | string (enum) | Yes | 연령대, 설문 완료 전 null |
| `surveyCompleted` | boolean | No | 로그인 후 설문 완료 여부 |
| `createdAt` | string (ISO 8601) | No | 계정 생성 일시 |

---

## 엔드포인트

---

### 1. 로그인 / 회원가입 — 구글

구글 OAuth를 시작하기 위해 유저의 브라우저를 아래 URL로 이동시킵니다.

```
GET /api/auth/google
```

**인증 필요:** 없음

**요청:** 없음

**응답:** `302 Redirect` → 구글 로그인 페이지

---

### 2. 구글 OAuth 콜백

> **이 엔드포인트는 구글이 직접 호출합니다. 프론트엔드에서 직접 호출하지 않습니다.**
> 프론트엔드는 리다이렉트 도착지 URL만 처리하면 됩니다.

```
GET /api/auth/google/callback
```

**인증 필요:** 없음

**응답:** `302 Redirect` →

```
{FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
```

httpOnly 쿠키도 함께 설정됩니다:

```
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
```

| 쿼리 파라미터 | 타입 | 설명 |
|---|---|---|
| `access_token` | string | JWT, 유효 기간 15분. localStorage가 아닌 메모리에 저장하세요. |
| `survey_required` | boolean string | `"true"`이면 설문 화면으로 이동 |

---

### 3. 로그인 / 회원가입 — 네이버

네이버 OAuth를 시작하기 위해 유저의 브라우저를 아래 URL로 이동시킵니다.

```
GET /api/auth/naver
```

**인증 필요:** 없음

**요청:** 없음

**응답:** `302 Redirect` → 네이버 로그인 페이지

---

### 4. 네이버 OAuth 콜백

> **네이버가 직접 호출합니다. 프론트엔드에서 직접 호출하지 않습니다.**

```
GET /api/auth/naver/callback
```

응답 형태는 [구글 OAuth 콜백](#2-구글-oauth-콜백)과 동일합니다.

---

### 5. 액세스 토큰 재발급

리프레시 토큰 쿠키를 사용해 새 액세스 토큰을 발급받습니다. 리프레시 토큰 쿠키도 함께 교체됩니다.

```
POST /api/auth/refresh
```

**인증 필요:** 없음 (리프레시 토큰 쿠키가 인증 수단)

**요청:**
- 바디 없음
- `refresh_token` 쿠키가 존재해야 합니다 (브라우저가 자동 전송)

**응답 `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

새로운 `refresh_token` 쿠키도 함께 설정됩니다.

**에러:**

| 상태 코드 | 조건 |
|---|---|
| `401` | 쿠키 없음, 토큰 만료, 또는 이미 사용된 토큰 재사용 시도 |

---

### 6. 로그아웃

```
POST /api/auth/logout
```

**인증 필요:** 없음 (리프레시 토큰 쿠키가 인증 수단)

**요청:** 바디 없음

**응답 `204`:** 내용 없음

`refresh_token` 쿠키를 삭제하고 Redis에서 토큰을 무효화합니다. 쿠키가 이미 없는 경우에도 안전하게 호출 가능합니다.

---

### 7. 내 프로필 조회

```
GET /api/users/me
```

**인증 필요:** 있음

**요청:** 바디 없음

**응답 `200`:** [유저 객체](#유저-객체)

---

### 8. 닉네임 변경

```
PATCH /api/users/me
```

**인증 필요:** 있음

**요청 바디:**

```json
{
  "nickname": "실뭉치장인"
}
```

| 필드 | 타입 | 필수 | 유효성 조건 |
|---|---|---|---|
| `nickname` | string | Yes | 2–30자. 한글, 영문, 숫자, 언더스코어만 허용 (`^[가-힣a-zA-Z0-9_]+$`) |

**응답 `200`:** [유저 객체](#유저-객체)

**에러:**

| 상태 코드 | 조건 |
|---|---|
| `400` | 유효성 검사 실패 |
| `409` | 닉네임 중복 |

---

### 9. 설문 제출

로그인 후 설문 답변을 저장합니다. 이후 재호출하여 연령대를 수정할 수 있습니다.

```
POST /api/users/me/survey
```

**인증 필요:** 있음

**요청 바디:**

```json
{
  "age": "2529"
}
```

| 필드 | 타입 | 필수 | 유효성 조건 |
|---|---|---|---|
| `age` | string (enum) | Yes | `age` enum 값 중 하나 |

**응답 `200`:** [유저 객체](#유저-객체) (`surveyCompleted: true`)

**에러:**

| 상태 코드 | 조건 |
|---|---|
| `400` | 유효하지 않은 연령대 값 |

---

### 10. 회원 탈퇴

계정을 소프트 삭제합니다. 이후 요청 시 액세스 토큰이 즉시 무효화되며, 모든 활성 세션이 종료됩니다.

```
DELETE /api/users/me
```

**인증 필요:** 있음

**요청:** 바디 없음

**응답 `204`:** 내용 없음

`refresh_token` 쿠키가 삭제됩니다.

> 탈퇴 후 동일한 액세스 토큰으로 요청하면 `401`이 반환됩니다. 매 요청마다 계정 상태를 검증하기 때문입니다.

---

## OAuth 로그인 전체 흐름

```
1. 프론트엔드 이동  →  GET /api/auth/google  (또는 /naver)
2. 유저가 소셜 로그인 페이지에서 승인
3. 소셜 제공자 리다이렉트  →  GET /api/auth/google/callback  (서버가 처리)
4. 서버 리다이렉트  →  {FRONTEND_URL}/auth/success?access_token=...&survey_required=...
5. 프론트엔드에서 access_token을 메모리에 저장
6. survey_required=true이면  →  설문 화면으로 이동 후 POST /api/users/me/survey 호출
7. access_token 만료 시  →  POST /api/auth/refresh 호출 (쿠키 자동 전송)
8. 로그아웃 시  →  POST /api/auth/logout 호출
```
