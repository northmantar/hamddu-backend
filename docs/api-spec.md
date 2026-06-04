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
| `400` | 잘못된 요청 (유효성 검사 실패) | “잘못된 요청입니다.” |
| `401` | 인증 실패 (토큰 없음/만료/유효하지 않음) | “인증이 필요합니다.” |
| `403` | 권한 없음 | “접근 권한이 없습니다.” |
| `404` | 리소스 없음 | “리소스를 찾을 수 없습니다.” |
| `409` | 충돌 (중복 등) | “이미 존재하는 값입니다.” |
| `500` | 서버 내부 오류 | “서버 오류가 발생했습니다.” |

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

---

# API 엔드포인트

---

## 1. SNS 로그인 인증 API

### 1.1 `GET /auth/google`

구글 OAuth를 시작합니다. 유저의 브라우저를 구글 로그인 페이지로 리다이렉트합니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음

**Response (302)**

```
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

---

### 1.2 `GET /auth/google/callback`

구글 OAuth 콜백 (구글이 직접 호출, 프론트엔드에서 직접 호출하지 않음)

**Request**

- Headers: 없음
- Query Parameters
    
    
    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | code | string | Yes | 구글에서 발급한 인가 코드 |
    | state | string | No | CSRF 방지용 상태값 |
- Body: 없음

**Response (302)**

```
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

---

### 1.3 `GET /auth/naver`

네이버 OAuth를 시작합니다. 유저의 브라우저를 네이버 로그인 페이지로 리다이렉트합니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음

**Response (302)**

```
Location: https://nid.naver.com/oauth2.0/authorize?...
```

---

### 1.4 `GET /auth/naver/callback`

네이버 OAuth 콜백 (네이버가 직접 호출)

**Request**

- Headers: 없음
- Query Parameters:
    
    
    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | code | string | Yes | 네이버에서 발급한 인가 코드 |
    | state | string | Yes | CSRF 방지용 상태값 |
- Body: 없음

**Response (302)**

```
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

---

### 1.5 `POST /auth/refresh`

리프레시 토큰을 사용해 새 액세스 토큰을 발급받습니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음
- Cookie: `refresh_token` (필수)

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | “유효하지 않은 리프레시 토큰입니다.” |

---

### 1.6 `POST /auth/logout`

로그아웃 처리 (리프레시 토큰 무효화)

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음
- Cookie: `refresh_token`

**Response (204)**

```
No Content
```

---

## 2. 유저 관련 API

### 2.1 `GET /users/me`

현재 로그인한 유저의 프로필을 조회합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body: 없음

**Response (200)**

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
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | “인증이 필요합니다.” |

---

### 2.2 `PATCH /users/me`

현재 로그인한 유저의 닉네임을 수정합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:
    
    ```json
    {
      "nickname": "실뭉치장인"
    }
    ```
    
    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `nickname` | string | Yes | 2–30자, 한글/영문/숫자/언더스코어만 허용 |

**Response (200)**

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
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | “닉네임은 2-30자의 한글, 영문, 숫자, 언더스코어만 허용됩니다.” |
| 409 | “이미 사용 중인 닉네임입니다.” |

---

### 2.3 `POST /users/me/survey`

로그인 후 설문 답변을 저장합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:
    
    ```json
    {
      "age": "2529",
      "gender": "F",
      "interests": "knitting",
      "ability": "intermediate"
    }
    ```
    
    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `age` | string | Yes | `age` enum 값 |
    | `gender` | string | Yes | `M` | `F` |
    | `interests` | string | Yes | `crochet` | `knitting` |
    | `ability` | string | Yes | `ability` enum 값 |

**Response (200)**

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
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | “유효하지 않은 설문 값입니다.” |

---

### 2.4 `DELETE /users/me`

회원 탈퇴 (소프트 삭제)

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body: 없음

**Response (204)**

```
No Content
```

---

### 2.5 `GET /users/:id` (관리자 전용)

특정 유저의 프로필을 조회합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body: 없음

**Response (200)**

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
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | “접근 권한이 없습니다.” |
| 404 | “유저를 찾을 수 없습니다.” |

---

### 2.6 `GET /users` (관리자 전용)

전체 유저 목록을 조회합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:
    
    
    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | status | string | No | 유저 상태 필터 (active | withdrawn) |
    | type | string | No | 유저 유형 필터 (member | admin) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "type": "member",
      "nickname": "실뭉치장인",
      "createdAt": "2026-04-09T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | “접근 권한이 없습니다.” |

---

## 3. 닉네임 API

### 3.1 `GET /nicknames/check`

닉네임 중복 여부를 확인합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:
    
    
    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | nickname | string | Yes | 확인할 닉네임 |
- Body: 없음

**Response (200)**

```json
{
  "nickname": "실뭉치장인",
  "available": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | “닉네임 형식이 올바르지 않습니다.” |

---

### 3.2 `GET /nicknames/suggestions`

랜덤 닉네임 후보 목록을 조회합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:
    
    
    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | count | number | No | 후보 개수 (기본값: 5, 최대: 10) |
- Body: 없음

**Response (200)**

```json
{
  "suggestions": [
    "귀여운실뭉치",
    "반짝이는털실",
    "따뜻한코바늘",
    "포근한뜨개장인",
    "알록달록실타래"
  ]
}
```

---

### 3.3 `POST /nicknames/generate`

자동으로 닉네임을 생성합니다. 중복 시 시퀀스 번호가 추가됩니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body: 없음

**Response (200)**

```json
{
  "nickname": "귀여운실뭉치3"
}
```

---

### 3.4 `POST /nicknames/register`

수동으로 닉네임을 등록합니다.

**Request**

- Headers:
    
    
    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:
    
    ```json
    {
      "nickname": "나만의닉네임"
    }
    ```
    
    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `nickname` | string | Yes | 2–30자, 한글/영문/숫자/언더스코어만 허용 |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nickname": "나만의닉네임",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | “닉네임은 2-30자의 한글, 영문, 숫자, 언더스코어만 허용됩니다.” |
| 409 | “이미 사용 중인 닉네임입니다.” |

---

## 4. 게시판 API

### 4.1 `GET /boards`

게시글 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | categoryId | string | No | 카테고리 ID 필터 |
    | sort | string | No | 정렬 기준 (latest \| popular, 기본값: latest) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "코바늘 시작하기 질문이요!",
      "body": "안녕하세요, 코바늘 입문자입니다...",
      "likeCount": 12,
      "thumbnailUrl": "https://cdn.hamddu.online/media/image1.jpg",
      "images": [
        { "id": "media-uuid-1", "url": "https://cdn.hamddu.online/media/image1.jpg", "sortOrder": 0 },
        { "id": "media-uuid-2", "url": "https://cdn.hamddu.online/media/image2.jpg", "sortOrder": 1 }
      ],
      "category": {
        "id": "category-uuid",
        "label": "질문/답변"
      },
      "author": {
        "id": "author-uuid",
        "nickname": "실뭉치장인"
      },
      "createdAt": "2026-04-09T12:00:00.000Z",
      "updatedAt": "2026-04-09T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

---

### 4.2 `GET /boards/categories`

게시판 카테고리 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "data": [
    {
      "id": "category-uuid-1",
      "label": "자유게시판",
      "status": "enabled"
    },
    {
      "id": "category-uuid-2",
      "label": "질문/답변",
      "status": "enabled"
    }
  ]
}
```

---

### 4.3 `GET /boards/:id`

특정 게시글을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 게시글 ID |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published",
  "title": "코바늘 시작하기 질문이요!",
  "body": "안녕하세요, 코바늘 입문자입니다...",
  "likeCount": 12,
  "isLiked": false,
  "thumbnailUrl": "https://cdn.hamddu.online/media/image1.jpg",
  "images": [
    { "id": "media-uuid-1", "url": "https://cdn.hamddu.online/media/image1.jpg", "sortOrder": 0 },
    { "id": "media-uuid-2", "url": "https://cdn.hamddu.online/media/image2.jpg", "sortOrder": 1 }
  ],
  "category": {
    "id": "category-uuid",
    "label": "질문/답변"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "게시글을 찾을 수 없습니다." |

---

### 4.4 `POST /boards`

새 게시글을 작성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "categoryId": "category-uuid",
      "title": "코바늘 시작하기 질문이요!",
      "body": "안녕하세요, 코바늘 입문자입니다...",
      "status": "published",
      "mediaIds": ["media-uuid-1", "media-uuid-2"],
      "thumbnailMediaId": "media-uuid-1"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `categoryId` | string | Yes | 유효한 카테고리 ID |
    | `title` | string | Yes | 1-200자 |
    | `body` | string | Yes | 1-10000자 |
    | `status` | string | No | `draft` \| `published` (기본값: `published`) |
    | `mediaIds` | string[] | No | 업로드된 미디어 ID 배열 (순서대로 sortOrder 부여) |
    | `thumbnailMediaId` | string | No | 대표 이미지로 지정할 미디어 ID (`mediaIds` 중 하나) |

**Response (201)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published",
  "title": "코바늘 시작하기 질문이요!",
  "body": "안녕하세요, 코바늘 입문자입니다...",
  "likeCount": 0,
  "isLiked": false,
  "thumbnailUrl": "https://cdn.hamddu.online/media/image1.jpg",
  "images": [
    { "id": "media-uuid-1", "url": "https://cdn.hamddu.online/media/image1.jpg", "sortOrder": 0 }
  ],
  "category": {
    "id": "category-uuid",
    "label": "질문/답변"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "제목은 1-200자 이내여야 합니다." |
| 400 | "유효하지 않은 카테고리입니다." |

---

### 4.5 `PATCH /boards/:id`

게시글을 수정합니다. (작성자 또는 관리자만 가능)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 게시글 ID |

- Body:

    ```json
    {
      "title": "수정된 제목",
      "body": "수정된 내용입니다...",
      "categoryId": "new-category-uuid",
      "mediaIds": ["media-uuid-1"],
      "thumbnailMediaId": "media-uuid-1"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `categoryId` | string | No | 유효한 카테고리 ID |
    | `title` | string | No | 1-200자 |
    | `body` | string | No | 1-10000자 |
    | `mediaIds` | string[] | No | 교체할 이미지 목록 (전달 시 기존 목록 전체 교체) |
    | `thumbnailMediaId` | string | No | 대표 이미지 변경 |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published",
  "title": "수정된 제목",
  "body": "수정된 내용입니다...",
  "likeCount": 12,
  "isLiked": false,
  "thumbnailUrl": "https://cdn.hamddu.online/media/image1.jpg",
  "images": [
    { "id": "media-uuid-1", "url": "https://cdn.hamddu.online/media/image1.jpg", "sortOrder": 0 }
  ],
  "category": {
    "id": "new-category-uuid",
    "label": "자유게시판"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-10T15:30:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "게시글을 찾을 수 없습니다." |

---

### 4.6 `DELETE /boards/:id`

게시글을 삭제합니다. (작성자 또는 관리자만 가능, 논리 삭제)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 게시글 ID |

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "게시글을 찾을 수 없습니다." |

---

### 4.7 `POST /boards/:id/like`

게시글에 좋아요를 추가합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 게시글 ID |

**Response (200)**

```json
{
  "boardId": "board-uuid",
  "likeCount": 13,
  "isLiked": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "게시글을 찾을 수 없습니다." |
| 409 | "이미 좋아요한 게시글입니다." |

---

### 4.8 `DELETE /boards/:id/like`

게시글 좋아요를 취소합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 게시글 ID |

**Response (200)**

```json
{
  "boardId": "board-uuid",
  "likeCount": 12,
  "isLiked": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "게시글을 찾을 수 없습니다." |
| 404 | "좋아요 기록이 없습니다." |

---

## 5. 댓글 API

### 5.1 `GET /boards/:boardId/comments`

특정 게시글의 댓글 목록을 조회합니다. 루트 댓글과 대댓글이 스레드 형식으로 반환됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "comment-uuid",
      "body": "좋은 정보 감사합니다!",
      "depth": 0,
      "parentId": null,
      "likeCount": 5,
      "isLiked": false,
      "author": {
        "id": "author-uuid",
        "nickname": "털실마스터"
      },
      "children": [
        {
          "id": "reply-uuid",
          "body": "저도 동의해요!",
          "depth": 1,
          "parentId": "comment-uuid",
          "likeCount": 2,
          "isLiked": true,
          "author": {
            "id": "reply-author-uuid",
            "nickname": "실뭉치장인"
          },
          "children": [],
          "createdAt": "2026-04-09T14:00:00.000Z",
          "updatedAt": "2026-04-09T14:00:00.000Z"
        }
      ],
      "createdAt": "2026-04-09T13:00:00.000Z",
      "updatedAt": "2026-04-09T13:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "게시글을 찾을 수 없습니다." |

---

### 5.2 `POST /boards/:boardId/comments`

댓글 또는 대댓글을 작성합니다. 대댓글을 작성하려면 `parentId`를 지정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |

- Body:

    ```json
    {
      "body": "좋은 정보 감사합니다!",
      "parentId": null
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `body` | string | Yes | 1-1000자 |
    | `parentId` | string | No | 부모 댓글 ID (대댓글인 경우 필수, 루트 댓글이면 null 또는 생략) |

**Response (201)**

```json
{
  "id": "comment-uuid",
  "body": "좋은 정보 감사합니다!",
  "depth": 0,
  "parentId": null,
  "likeCount": 0,
  "isLiked": false,
  "author": {
    "id": "author-uuid",
    "nickname": "털실마스터"
  },
  "children": [],
  "createdAt": "2026-04-09T13:00:00.000Z",
  "updatedAt": "2026-04-09T13:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "댓글 내용은 1-1000자 이내여야 합니다." |
| 400 | "대댓글에는 답글을 달 수 없습니다." |
| 404 | "게시글을 찾을 수 없습니다." |
| 404 | "부모 댓글을 찾을 수 없습니다." |

---

### 5.3 `PATCH /boards/:boardId/comments/:commentId`

댓글을 수정합니다. (작성자 또는 관리자만 가능)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |
    | commentId | uuid | Yes | 댓글 ID |

- Body:

    ```json
    {
      "body": "수정된 댓글 내용입니다."
    }
    ```

**Response (200)**

```json
{
  "id": "comment-uuid",
  "body": "수정된 댓글 내용입니다.",
  "depth": 0,
  "parentId": null,
  "likeCount": 5,
  "isLiked": false,
  "author": {
    "id": "author-uuid",
    "nickname": "털실마스터"
  },
  "createdAt": "2026-04-09T13:00:00.000Z",
  "updatedAt": "2026-04-10T14:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "삭제된 댓글은 수정할 수 없습니다." |
| 403 | "접근 권한이 없습니다." |
| 404 | "댓글을 찾을 수 없습니다." |

---

### 5.4 `DELETE /boards/:boardId/comments/:commentId`

댓글을 삭제합니다. (작성자 또는 관리자만 가능, 논리 삭제)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |
    | commentId | uuid | Yes | 댓글 ID |

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "댓글을 찾을 수 없습니다." |

---

### 5.5 `POST /boards/:boardId/comments/:commentId/like`

댓글에 좋아요를 추가합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |
    | commentId | uuid | Yes | 댓글 ID |

**Response (200)**

```json
{
  "commentId": "comment-uuid",
  "likeCount": 6,
  "isLiked": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "댓글을 찾을 수 없습니다." |
| 409 | "이미 좋아요한 댓글입니다." |

---

### 5.6 `DELETE /boards/:boardId/comments/:commentId/like`

댓글 좋아요를 취소합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | uuid | Yes | 게시글 ID |
    | commentId | uuid | Yes | 댓글 ID |

**Response (200)**

```json
{
  "commentId": "comment-uuid",
  "likeCount": 5,
  "isLiked": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "댓글을 찾을 수 없습니다." |
| 404 | "좋아요 기록이 없습니다." |

---

## 6. 콘텐츠 API

### 6.1 `GET /contents`

콘텐츠 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | type | string | No | 콘텐츠 유형 (symbol \| free \| normal) |
    | channelId | string | No | 채널 ID 필터 |

**Response (200)**

```json
{
  "data": [
    {
      "id": "content-uuid",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "name": "코바늘 기초 - 사슬뜨기",
      "type": "symbol",
      "channel": {
        "id": "channel-uuid",
        "name": "함뜨 공식채널"
      },
      "interests": "crochet",
      "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
      "pointApplyable": true,
      "sortOrder": 1,
      "uploadedAt": "2026-04-01T10:00:00.000Z",
      "createdAt": "2026-04-02T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

---

### 6.2 `GET /contents/tutorials`

튜토리얼 콘텐츠(type='symbol') 목록을 sortOrder 순서대로 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | interests | string | Yes | 관심사 (`crochet` \| `knitting`) |

**Response (200)**

```json
[
  {
    "id": "content-uuid-1",
    "youtubeVideoId": "abc123",
    "name": "코바늘 기초 1강 - 사슬뜨기",
    "type": "symbol",
    "channel": {
      "id": "channel-uuid",
      "name": "함뜨 공식채널"
    },
    "interests": "crochet",
    "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
    "pointApplyable": true,
    "sortOrder": 1,
    "uploadedAt": "2026-04-01T10:00:00.000Z",
    "createdAt": "2026-04-02T12:00:00.000Z"
  },
  {
    "id": "content-uuid-2",
    "youtubeVideoId": "def456",
    "name": "코바늘 기초 2강 - 짧은뜨기",
    "type": "symbol",
    "channel": {
      "id": "channel-uuid",
      "name": "함뜨 공식채널"
    },
    "interests": "crochet",
    "imageUrl": "https://cdn.hamddu.online/symbols/single-crochet.png",
    "pointApplyable": true,
    "sortOrder": 2,
    "uploadedAt": "2026-04-02T10:00:00.000Z",
    "createdAt": "2026-04-03T12:00:00.000Z"
  }
]
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "interests는 필수 파라미터입니다." |

---

### 6.4 `GET /contents/:id`

특정 콘텐츠를 조회합니다.

**튜토리얼 콘텐츠 (type === 'symbol')인 경우**, 현재 로그인한 사용자의 마지막 시청 기록(`watchHistory`)이 함께 제공됩니다. 시청 기록이 없는 경우 `watchHistory`는 `null`입니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 콘텐츠 ID |

**Response (200) - 튜토리얼 콘텐츠 (type: "symbol")**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "pointApplyable": true,
  "sortOrder": 1,
  "watchHistory": {
    "watchRate": 55,
    "lastWatchedTimestamp": "00:05:30",
    "lastWatchedAt": "2026-04-09T15:00:00.000Z"
  },
  "challengeCompleted": false,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z"
}
```

**Response (200) - 무료 도안 콘텐츠 (type: "free")**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "abc123XYZ",
  "name": "귀여운 토끼 인형 도안",
  "type": "free",
  "interests": "crochet",
  "imageUrl": null,
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "pointApplyable": false,
  "sortOrder": null,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z"
}
```

| 필드 | 타입 | 조건 | 설명 |
| --- | --- | --- | --- |
| `watchHistory` | object \| null | type === 'symbol' | 튜토리얼 콘텐츠일 경우에만 제공 |
| `watchHistory.watchRate` | number | - | 시청 비율 (0-100) |
| `watchHistory.lastWatchedTimestamp` | string | - | 마지막 시청 위치 (HH:mm:ss) |
| `watchHistory.lastWatchedAt` | string | - | 마지막 시청 일시 |
| `challengeCompleted` | boolean | type === 'symbol' | 튜토리얼 콘텐츠일 경우에만 제공 |

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

### 6.5 `POST /contents` (관리자 전용)

새 콘텐츠를 등록합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "channelId": "channel-uuid",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "name": "코바늘 기초 - 사슬뜨기",
      "type": "symbol",
      "interests": "crochet",
      "mediaId": "media-uuid",
      "sortOrder": 1,
      "pointApplyable": true
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `channelId` | string | Yes | 유효한 채널 ID |
    | `youtubeVideoId` | string | Yes | 유튜브 비디오 ID |
    | `name` | string | Yes | 1-255자 |
    | `type` | string | Yes | `symbol` \| `free` \| `normal` |
    | `interests` | string | No | `crochet` \| `knitting` |
    | `mediaId` | string | No | 기호 버튼 이미지 미디어 ID (`POST /media/upload` 응답의 `id`, symbol 타입에만 사용) |
    | `sortOrder` | number | No | interests 내 정렬 순서 (1부터 시작) |
    | `pointApplyable` | boolean | No | 포인트 지급 여부 (기본값: false) |

**Response (201)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "pointApplyable": true,
  "sortOrder": 1,
  "uploadedAt": null,
  "createdAt": "2026-04-02T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 채널입니다." |
| 403 | "접근 권한이 없습니다." |
| 409 | "이미 등록된 유튜브 비디오입니다." |

---

### 6.6 `PATCH /contents/:id` (관리자 전용)

콘텐츠 정보를 수정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 콘텐츠 ID |

- Body:

    ```json
    {
      "name": "수정된 콘텐츠 제목",
      "mediaId": "media-uuid",
      "sortOrder": 2,
      "pointApplyable": false
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | No | 1-255자 |
    | `mediaId` | string | No | 이미지 미디어 ID (`POST /media/upload` 응답의 `id`) |
    | `sortOrder` | number | No | interests 내 정렬 순서 (1 이상) |
    | `pointApplyable` | boolean | No | 포인트 지급 여부 |

**Response (200)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "수정된 콘텐츠 제목",
  "type": "symbol",
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/media/chain-v2.jpg",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "pointApplyable": false,
  "sortOrder": 2,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

### 6.7 `PATCH /contents/:id/order` (관리자 전용)

콘텐츠 순서를 변경합니다. 같은 interests 내 다른 콘텐츠들의 순서도 자동으로 재조정됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 콘텐츠 ID |

- Body:

    ```json
    {
      "sortOrder": 3
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `sortOrder` | number | Yes | 새로운 정렬 순서 (1 이상) |

**Response (200)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "pointApplyable": true,
  "sortOrder": 3,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "interests가 지정되지 않은 콘텐츠는 순서를 변경할 수 없습니다." |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

### 6.8 `DELETE /contents/:id` (관리자 전용)

콘텐츠를 삭제합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 콘텐츠 ID |

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

## 7. 시청 기록 API

### 7.1 `GET /watch-history`

현재 유저의 시청 기록 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "history-uuid",
      "content": {
        "id": "content-uuid",
        "name": "코바늘 기초 - 사슬뜨기",
        "type": "symbol"
      },
      "totalDuration": 600,
      "lastWatchedTimestamp": "00:05:30",
      "watchRate": 55,
      "createdAt": "2026-04-09T10:00:00.000Z",
      "lastWatchedAt": "2026-04-09T15:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 30,
    "totalPages": 2
  }
}
```

---

### 7.2 `POST /watch-history`

시청 기록을 저장/업데이트합니다. 동일한 콘텐츠에 대한 기록이 있으면 업데이트, 없으면 새로 생성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "contentId": "content-uuid",
      "totalDuration": 600,
      "lastWatchedTimestamp": "00:05:30",
      "watchRate": 55
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `contentId` | string | Yes | 유효한 콘텐츠 ID |
    | `totalDuration` | number | Yes | 전체 영상 길이 (초) |
    | `lastWatchedTimestamp` | string | Yes | 마지막 시청 위치 (HH:mm:ss) |
    | `watchRate` | number | Yes | 시청 비율 (0-100) |

**Response (200)**

```json
{
  "id": "history-uuid",
  "contentId": "content-uuid",
  "totalDuration": 600,
  "lastWatchedTimestamp": "00:05:30",
  "watchRate": 55,
  "createdAt": "2026-04-09T10:00:00.000Z",
  "lastWatchedAt": "2026-04-09T15:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

## 8. 챌린지 API

### 8.1 `GET /challenges`

챌린지(인증 게시글) 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | contentId | string | No | 특정 콘텐츠에 대한 챌린지만 조회 |

**Response (200)**

```json
{
  "data": [
    {
      "id": "challenge-uuid",
      "title": "사슬뜨기 완성!",
      "body": "드디어 첫 작품을 완성했어요!",
      "imageUrl": "https://cdn.hamddu.com/challenges/image.jpg",
      "content": {
        "id": "content-uuid",
        "name": "코바늘 기초 - 사슬뜨기"
      },
      "author": {
        "id": "author-uuid",
        "nickname": "실뭉치장인"
      },
      "createdAt": "2026-04-09T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3
  }
}
```

---

### 8.2 `GET /challenges/my`

내가 등록한 챌린지 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "challenge-uuid",
      "title": "사슬뜨기 완성!",
      "imageUrl": "https://cdn.hamddu.com/challenges/image.jpg",
      "imageUploaded": true,
      "stampGranted": true,
      "content": {
        "id": "content-uuid",
        "name": "코바늘 기초 - 사슬뜨기"
      },
      "createdAt": "2026-04-09T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 10,
    "totalPages": 1
  }
}
```

---

### 8.3 `GET /challenges/:id`

특정 챌린지를 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 챌린지 ID |

**Response (200)**

```json
{
  "id": "challenge-uuid",
  "title": "사슬뜨기 완성!",
  "body": "드디어 첫 작품을 완성했어요!",
  "imageUrl": "https://cdn.hamddu.com/challenges/image.jpg",
  "imageUploaded": true,
  "stampGranted": true,
  "content": {
    "id": "content-uuid",
    "name": "코바늘 기초 - 사슬뜨기",
    "type": "symbol"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "챌린지를 찾을 수 없습니다." |

---

### 8.4 `POST /challenges`

챌린지를 등록합니다 (작품 인증).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
    | Content-Type | application/json | Yes |

- Body:

    ```json
    {
      "contentId": "content-uuid",
      "title": "사슬뜨기 완성!",
      "body": "드디어 첫 작품을 완성했어요!",
      "mediaId": "media-uuid"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `contentId` | string | Yes | 인증할 콘텐츠 ID |
    | `title` | string | No | 최대 200자 |
    | `body` | string | No | 최대 2000자 |
    | `mediaId` | string | No | 인증 이미지 미디어 ID (`POST /media/upload` 응답의 `id`) |

    > 이미지는 먼저 `POST /media/upload`로 업로드한 뒤 반환된 `id`를 `mediaId`에 전달합니다.

**Response (201)**

```json
{
  "id": "challenge-uuid",
  "title": "사슬뜨기 완성!",
  "body": "드디어 첫 작품을 완성했어요!",
  "imageUrl": "https://cdn.hamddu.online/media/proof.jpg",
  "imageUploaded": true,
  "stampGranted": true,
  "content": {
    "id": "content-uuid",
    "name": "코바늘 기초 - 사슬뜨기",
    "type": "symbol"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "pointEarned": 100,
  "xpEarned": 50,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "콘텐츠를 찾을 수 없습니다." |
| 409 | "이미 해당 콘텐츠에 대한 챌린지를 완료했습니다." |

---

## 9. 포인트 API

### 9.1 `GET /points/wallet`

현재 유저의 포인트 지갑 정보를 조회합니다. 지갑이 없으면 자동으로 생성됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "id": "wallet-uuid",
  "balance": 1500,
  "totalEarned": 2000,
  "totalUsed": 500,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-09T16:00:00.000Z"
}
```

---

### 9.2 `GET /points/transactions`

포인트 거래 내역을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | type | string | No | 트랜잭션 유형 필터 (EARN \| USE \| CANCEL) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "type": "EARN",
      "status": "COMPLETED",
      "amount": 100,
      "description": "챌린지 완료 보상",
      "refType": "challenge",
      "refId": "challenge-uuid",
      "expiredAt": "2027-04-09T16:00:00.000Z",
      "createdAt": "2026-04-09T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3
  }
}
```

---

### 9.3 `POST /points/earn` (관리자/내부용)

포인트를 지급합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "memberId": "member-uuid",
      "policyId": "policy-uuid",
      "refType": "challenge",
      "refId": "challenge-uuid",
      "description": "챌린지 완료 보상"
    }
    ```

    | 필드 | 타입 | 필수 | 설명 |
    | --- | --- | --- | --- |
    | `memberId` | string | Yes | 대상 유저 ID |
    | `policyId` | string | Yes | 적용할 포인트 정책 ID |
    | `refType` | string | Yes | 참조 테이블 식별자 |
    | `refId` | string | Yes | 참조 행의 ID |
    | `description` | string | No | 트랜잭션 설명 |

**Response (200)**

```json
{
  "id": "transaction-uuid",
  "type": "EARN",
  "status": "COMPLETED",
  "amount": 100,
  "description": "챌린지 완료 보상",
  "newBalance": 1600,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |
| 404 | "포인트 정책을 찾을 수 없습니다." |

---

### 9.4 `GET /points/policies` (관리자 전용)

포인트 적립 정책 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "data": [
    {
      "id": "policy-uuid",
      "actionType": "CHALLENGE",
      "pointAmount": 100,
      "isOneTime": false,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 10. XP API

### 10.1 `GET /xp/wallet`

현재 유저의 XP 지갑 정보를 조회합니다. 지갑이 없으면 자동으로 생성됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "id": "wallet-uuid",
  "totalXp": 1250,
  "currentLevel": 5,
  "levelLabel": "초급 뜨개러",
  "xpToNextLevel": 250,
  "nextLevelThreshold": 1500,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-09T16:00:00.000Z"
}
```

---

### 10.2 `GET /xp/transactions`

XP 거래 내역을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "amount": 50,
      "description": "챌린지 완료",
      "refType": "challenge",
      "refId": "challenge-uuid",
      "createdAt": "2026-04-09T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 30,
    "totalPages": 2
  }
}
```

---

### 10.3 `POST /xp/earn` (관리자/내부용)

XP를 지급합니다. 레벨업 시 자동으로 레벨이 업데이트됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "memberId": "member-uuid",
      "amount": 50,
      "refType": "challenge",
      "refId": "challenge-uuid",
      "description": "챌린지 완료"
    }
    ```

    | 필드 | 타입 | 필수 | 설명 |
    | --- | --- | --- | --- |
    | `memberId` | string | Yes | 대상 유저 ID |
    | `amount` | number | Yes | 지급할 XP 양 (1 이상) |
    | `refType` | string | Yes | 참조 테이블 식별자 |
    | `refId` | string | Yes | 참조 행의 ID |
    | `description` | string | No | 트랜잭션 설명 |

**Response (200)**

```json
{
  "id": "transaction-uuid",
  "amount": 50,
  "description": "챌린지 완료",
  "newTotalXp": 1300,
  "newLevel": 5,
  "leveledUp": false,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |
| 404 | "레벨 정책이 설정되지 않았습니다." |

---

### 10.4 `GET /xp/levels`

XP 레벨 정책 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "data": [
    {
      "id": "policy-uuid",
      "level": 1,
      "xpThreshold": 0,
      "label": "새싹 뜨개러",
      "isActive": true
    },
    {
      "id": "policy-uuid-2",
      "level": 2,
      "xpThreshold": 100,
      "label": "입문 뜨개러",
      "isActive": true
    }
  ]
}
```

---

## 11. 어드민 인증 API

### 11.1 `POST /auth/admin/login`

어드민 이메일/비밀번호로 로그인합니다.

**Request**

- Headers: 없음

- Body:

    ```json
    {
      "email": "admin@example.com",
      "password": "password123!"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `email` | string | Yes | 유효한 이메일 |
    | `password` | string | Yes | 최소 8자 |

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "type": "admin"
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "비밀번호가 설정되지 않았습니다." |
| 401 | "이메일 또는 비밀번호가 올바르지 않습니다." |

---

### 11.2 `POST /auth/admin/set-password`

어드민 비밀번호를 최초 설정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "password": "password123!"
    }
    ```

**Response (200)**

```json
{
  "message": "비밀번호가 설정되었습니다."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "비밀번호가 이미 설정되어 있습니다." |
| 403 | "어드민만 비밀번호를 설정할 수 있습니다." |

---

### 11.3 `PATCH /auth/admin/change-password`

어드민 비밀번호를 변경합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "currentPassword": "oldPassword123!",
      "newPassword": "newPassword123!"
    }
    ```

**Response (200)**

```json
{
  "message": "비밀번호가 변경되었습니다."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "비밀번호가 설정되지 않았습니다." |
| 401 | "현재 비밀번호가 올바르지 않습니다." |
| 403 | "어드민만 비밀번호를 변경할 수 있습니다." |

---

## 12. 유저 관리 API (관리자 전용)

### 12.1 `POST /users`

새 유저를 직접 생성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "email": "newuser@example.com",
      "password": "password123!",
      "type": "member"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `email` | string | Yes | 유효한 이메일 |
    | `password` | string | Yes | 최소 8자 |
    | `type` | string | No | `member` \| `admin` (기본값: `member`) |

**Response (201)**

```json
{
  "id": "user-uuid",
  "status": "active",
  "type": "member",
  "nickname": null,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 409 | "이미 등록된 이메일입니다." |

---

### 12.3 `GET /users`

전체 유저 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |

**Response (200)**

```json
{
  "data": [
    {
      "id": "user-uuid",
      "status": "active",
      "type": "member",
      "nickname": "실뭉치장인",
      "createdAt": "2026-04-09T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

---

### 12.4 `PATCH /users/:id/role`

유저의 역할을 변경합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 유저 ID |

- Body:

    ```json
    {
      "type": "admin"
    }
    ```

**Response (200)**

```json
{
  "id": "user-uuid",
  "status": "active",
  "type": "admin",
  "nickname": "실뭉치장인",
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |

---

## 13. 게시판 카테고리 관리 API (관리자 전용)

### 13.1 `POST /boards/categories`

새 카테고리를 생성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "label": "자유게시판"
    }
    ```

**Response (201)**

```json
{
  "id": "category-uuid",
  "label": "자유게시판",
  "status": "enabled"
}
```

---

### 13.2 `PATCH /boards/categories/:categoryId`

카테고리를 수정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | categoryId | uuid | Yes | 카테고리 ID |

- Body:

    ```json
    {
      "label": "수정된 카테고리명",
      "status": "enabled"
    }
    ```

**Response (200)**

```json
{
  "id": "category-uuid",
  "label": "수정된 카테고리명",
  "status": "enabled"
}
```

---

### 13.3 `DELETE /boards/categories/:categoryId`

카테고리를 삭제합니다. (비활성화 처리)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | categoryId | uuid | Yes | 카테고리 ID |

**Response (204)**

```
No Content
```

---

## 14. 포인트 정책 관리 API (관리자 전용)

### 14.1 `POST /points/policies`

새 포인트 정책을 생성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "actionType": "WATCH",
      "pointAmount": 100,
      "isOneTime": false,
      "isActive": true
    }
    ```

**Response (201)**

```json
{
  "id": "policy-uuid",
  "actionType": "WATCH",
  "pointAmount": 100,
  "isOneTime": false,
  "isActive": true,
  "createdAt": "2026-04-09T16:00:00.000Z",
  "updatedAt": "2026-04-09T16:00:00.000Z"
}
```

---

### 14.2 `PATCH /points/policies/:id`

포인트 정책을 수정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 정책 ID |

- Body:

    ```json
    {
      "pointAmount": 150,
      "isActive": false
    }
    ```

**Response (200)**

```json
{
  "id": "policy-uuid",
  "actionType": "WATCH",
  "pointAmount": 150,
  "isOneTime": false,
  "isActive": false,
  "createdAt": "2026-04-09T16:00:00.000Z",
  "updatedAt": "2026-04-10T12:00:00.000Z"
}
```

---

### 14.3 `DELETE /points/policies/:id`

포인트 정책을 삭제합니다. (비활성화 처리)

**Response (204)**

```
No Content
```

---

## 15. XP 레벨 정책 관리 API (관리자 전용)

### 15.1 `POST /xp/levels`

새 XP 레벨 정책을 생성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "level": 1,
      "xpThreshold": 0,
      "label": "새싹 뜨개러",
      "isActive": true
    }
    ```

**Response (201)**

```json
{
  "id": "policy-uuid",
  "level": 1,
  "xpThreshold": 0,
  "label": "새싹 뜨개러",
  "isActive": true
}
```

---

### 15.2 `PATCH /xp/levels/:id`

XP 레벨 정책을 수정합니다.

**Response (200)**

```json
{
  "id": "policy-uuid",
  "level": 1,
  "xpThreshold": 100,
  "label": "수정된 레벨명",
  "isActive": true
}
```

---

### 15.3 `DELETE /xp/levels/:id`

XP 레벨 정책을 삭제합니다. (비활성화 처리)

**Response (204)**

```
No Content
```

---

## 16. 채널 API

### 16.1 `GET /channels`

등록된 채널 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

**Response (200)**

```json
{
  "data": [
    {
      "id": "channel-uuid",
      "name": "함뜨 공식채널",
      "youtubeChannelId": "UC...",
      "addedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 16.2 `POST /channels` (관리자 전용)

새 채널을 등록합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Body:

    ```json
    {
      "name": "함뜨 공식채널",
      "youtubeChannelId": "UC..."
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | Yes | 1-255자 |
    | `youtubeChannelId` | string | Yes | 유튜브 채널 ID |

**Response (201)**

```json
{
  "id": "channel-uuid",
  "name": "함뜨 공식채널",
  "youtubeChannelId": "UC...",
  "addedAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 409 | "이미 등록된 채널입니다." |

---

### 16.3 `PATCH /channels/:id` (관리자 전용)

채널 정보를 수정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 채널 ID |

- Body:

    ```json
    {
      "name": "수정된 채널명"
    }
    ```

**Response (200)**

```json
{
  "id": "channel-uuid",
  "name": "수정된 채널명",
  "youtubeChannelId": "UC...",
  "addedAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "채널을 찾을 수 없습니다." |

---

### 16.4 `DELETE /channels/:id` (관리자 전용)

채널을 삭제합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |

- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | uuid | Yes | 채널 ID |

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "채널을 찾을 수 없습니다." |

---

## 17. 미디어 API

### 17.1 `POST /media/upload`

이미지 파일을 Cloudflare R2에 업로드하고 미디어 레코드를 생성합니다. 반환된 `id`를 챌린지(`mediaId`), 콘텐츠(`mediaId`), 게시글(`mediaIds`) 등의 요청에 사용합니다.

> 파일은 Cloudflare R2 버킷(`R2_BUCKET_NAME`)의 `media/` 경로에 저장되며, 응답의 `url`은 `CDN_BASE_URL/media/{timestamp}-{filename}` 형식의 CDN 공개 URL입니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
    | Content-Type | multipart/form-data | Yes |

- Body (multipart/form-data):

    | **필드** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | file | file | Yes | 업로드할 이미지 파일 |

**Response (201)**

```json
{
  "id": "media-uuid",
  "url": "https://cdn.hamddu.online/media/1748920000000-photo.jpg",
  "mimeType": "image/jpeg",
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | "인증이 필요합니다." |

---

## API 요약표

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
|  | GET | /nicknames/suggestions | 인증 | 랜덤 후보 조회 |
|  | POST | /nicknames/generate | 인증 | 자동 발급 |
|  | POST | /nicknames/register | 인증 | 수동 등록 |
| **게시판** | GET | /boards | 인증 | 게시글 목록 |
|  | GET | /boards/categories | 인증 | 카테고리 목록 |
|  | GET | /boards/:id | 인증 | 게시글 상세 |
|  | POST | /boards | 인증 | 게시글 작성 |
|  | PATCH | /boards/:id | 작성자/관리자 | 게시글 수정 |
|  | DELETE | /boards/:id | 작성자/관리자 | 게시글 삭제 |
|  | POST | /boards/:id/like | 인증 | 좋아요 |
|  | DELETE | /boards/:id/like | 인증 | 좋아요 취소 |
| **댓글** | GET | /boards/:boardId/comments | 인증 | 댓글 목록 (스레드 형식) |
|  | POST | /boards/:boardId/comments | 인증 | 댓글/대댓글 작성 |
|  | PATCH | /boards/:boardId/comments/:commentId | 작성자/관리자 | 댓글 수정 |
|  | DELETE | /boards/:boardId/comments/:commentId | 작성자/관리자 | 댓글 삭제 |
|  | POST | /boards/:boardId/comments/:commentId/like | 인증 | 댓글 좋아요 |
|  | DELETE | /boards/:boardId/comments/:commentId/like | 인증 | 댓글 좋아요 취소 |
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
| **어드민 인증** | POST | /auth/admin/login | - | 어드민 이메일/비밀번호 로그인 |
|  | POST | /auth/admin/set-password | 어드민 | 비밀번호 최초 설정 |
|  | PATCH | /auth/admin/change-password | 어드민 | 비밀번호 변경 |
| **유저 관리** | POST | /users | 관리자 | 유저 생성 |
|  | GET | /users | 관리자 | 유저 목록 |
|  | PATCH | /users/:id/role | 관리자 | 유저 역할 변경 |
| **카테고리 관리** | POST | /boards/categories | 관리자 | 카테고리 생성 |
|  | PATCH | /boards/categories/:id | 관리자 | 카테고리 수정 |
|  | DELETE | /boards/categories/:id | 관리자 | 카테고리 삭제 |
| **포인트 정책** | POST | /points/policies | 관리자 | 정책 생성 |
|  | PATCH | /points/policies/:id | 관리자 | 정책 수정 |
|  | DELETE | /points/policies/:id | 관리자 | 정책 삭제 |
| **XP 레벨 정책** | POST | /xp/levels | 관리자 | 레벨 정책 생성 |
|  | PATCH | /xp/levels/:id | 관리자 | 레벨 정책 수정 |
|  | DELETE | /xp/levels/:id | 관리자 | 레벨 정책 삭제 |
| **채널** | GET | /channels | 인증 | 채널 목록 |
|  | POST | /channels | 관리자 | 채널 등록 |
|  | PATCH | /channels/:id | 관리자 | 채널 수정 |
|  | DELETE | /channels/:id | 관리자 | 채널 삭제 |
| **미디어** | POST | /media/upload | 인증 | 이미지 업로드 |
