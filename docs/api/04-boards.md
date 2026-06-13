# 4. 게시판 API

## 4.1 `GET /boards`

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
    | categoryId | string (UUID) | No | 카테고리 ID 필터 |
    | sort | string | No | 정렬 옵션 (`latest` \| `popular`, 기본값: `latest`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "코바늘 시작하기 질문이요!",
      "body": "안녕하세요, 코바늘 입문자입니다...",
      "likeCount": 12,
      "category": {
        "id": "category-uuid",
        "label": "질문/답변"
      },
      "author": {
        "id": "author-uuid",
        "nickname": "실뭉치장인"
      },
      "media": [
        {
          "id": "media-uuid",
          "url": "https://cdn.hamddu.online/media/abc123.jpg",
          "mimeType": "image/jpeg"
        }
      ],
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

## 4.2 `GET /boards/categories`

게시판 카테고리 목록을 조회합니다.

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

## 4.3 `GET /boards/:id`

게시글 상세를 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body: 없음

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "코바늘 시작하기 질문이요!",
  "body": "안녕하세요, 코바늘 입문자입니다...",
  "likeCount": 12,
  "status": "published",
  "category": {
    "id": "category-uuid",
    "label": "질문/답변"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "media": [
    {
      "id": "media-uuid",
      "url": "https://cdn.hamddu.online/media/abc123.jpg",
      "mimeType": "image/jpeg"
    }
  ],
  "isLiked": false,
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "게시글을 찾을 수 없습니다." |

---

## 4.4 `POST /boards`

게시글을 작성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "categoryId": "category-uuid",
      "title": "코바늘 시작하기 질문이요!",
      "body": "안녕하세요, 코바늘 입문자입니다...",
      "status": "published",
      "mediaIds": ["media-uuid-1", "media-uuid-2"]
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `categoryId` | string (UUID) | Yes | 유효한 UUID |
    | `title` | string | Yes | 1–200자 |
    | `body` | string | Yes | 1–10000자 |
    | `status` | string | No | `draft` \| `published` (기본값: `published`) |
    | `mediaIds` | string[] (UUID[]) | No | 첨부할 미디어 ID 목록 (순서대로 저장) |

**Response (201)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "코바늘 시작하기 질문이요!",
  "body": "안녕하세요, 코바늘 입문자입니다...",
  "likeCount": 0,
  "status": "published",
  "category": {
    "id": "category-uuid",
    "label": "질문/답변"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "media": [
    {
      "id": "media-uuid-1",
      "url": "https://cdn.hamddu.online/media/abc123.jpg",
      "mimeType": "image/jpeg"
    }
  ],
  "isLiked": false,
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 요청입니다." |
| 400 | "유효하지 않은 미디어 ID가 포함되어 있습니다." |

---

## 4.5 `PATCH /boards/:id`

게시글을 수정합니다. 작성자 또는 관리자만 수정 가능합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body:

    ```json
    {
      "categoryId": "category-uuid",
      "title": "수정된 제목",
      "body": "수정된 본문 내용",
      "mediaIds": ["media-uuid-1", "media-uuid-2"]
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `categoryId` | string (UUID) | No | 유효한 UUID |
    | `title` | string | No | 1–200자 |
    | `body` | string | No | 1–10000자 |
    | `mediaIds` | string[] (UUID[]) | No | 첨부할 미디어 ID 목록 (기존 미디어 대체) |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "수정된 제목",
  "body": "수정된 본문 내용",
  "likeCount": 12,
  "status": "published",
  "category": {
    "id": "category-uuid",
    "label": "질문/답변"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "media": [
    {
      "id": "media-uuid-1",
      "url": "https://cdn.hamddu.online/media/abc123.jpg",
      "mimeType": "image/jpeg"
    }
  ],
  "isLiked": true,
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T13:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 미디어 ID가 포함되어 있습니다." |
| 403 | "접근 권한이 없습니다." |
| 404 | "게시글을 찾을 수 없습니다." |

---

## 4.6 `DELETE /boards/:id`

게시글을 삭제합니다. 작성자 또는 관리자만 삭제 가능합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body: 없음

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

## 4.7 `POST /boards/:id/like`

게시글에 좋아요를 누릅니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body: 없음

**Response (200)**

```json
{
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "likeCount": 13,
  "isLiked": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 409 | "이미 좋아요한 게시글입니다." |

---

## 4.8 `DELETE /boards/:id/like`

게시글 좋아요를 취소합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body: 없음

**Response (200)**

```json
{
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "likeCount": 12,
  "isLiked": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "좋아요 기록을 찾을 수 없습니다." |

---

## 4.9 `POST /boards/:id/report`

게시글을 신고합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 게시글 ID |
- Body:

    ```json
    {
      "reason": "spam",
      "description": "광고성 게시글입니다."
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `reason` | string | Yes | `reportReason` enum 값 (`spam` \| `harassment` \| `inappropriate` \| `copyright` \| `other`) |
    | `description` | string | No | 최대 1000자 |

**Response (201)**

```json
{
  "id": "report-uuid",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "신고가 접수되었습니다."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "본인 게시글은 신고할 수 없습니다." |
| 404 | "게시글을 찾을 수 없습니다." |
| 409 | "이미 신고한 게시글입니다." |
