# 5. 댓글 API

## 5.1 `GET /boards/:boardId/comments`

게시글의 댓글 목록을 스레드 형식으로 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "comment-uuid-1",
      "body": "좋은 정보 감사합니다!",
      "depth": 0,
      "parentId": null,
      "likeCount": 5,
      "isLiked": false,
      "author": {
        "id": "author-uuid",
        "nickname": "뜨개초보"
      },
      "children": [
        {
          "id": "comment-uuid-2",
          "body": "저도 같은 생각이에요!",
          "depth": 1,
          "parentId": "comment-uuid-1",
          "likeCount": 2,
          "isLiked": true,
          "author": {
            "id": "author-uuid-2",
            "nickname": "실뭉치장인"
          },
          "children": [],
          "createdAt": "2026-04-09T13:30:00.000Z",
          "updatedAt": "2026-04-09T13:30:00.000Z"
        }
      ],
      "createdAt": "2026-04-09T13:00:00.000Z",
      "updatedAt": "2026-04-09T13:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 25,
    "totalPages": 2
  }
}
```

---

## 5.2 `POST /boards/:boardId/comments`

댓글 또는 대댓글을 작성합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
- Body:

    ```json
    {
      "body": "좋은 정보 감사합니다!",
      "parentId": null
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `body` | string | Yes | 1–1000자 |
    | `parentId` | string (UUID) | No | 부모 댓글 ID (대댓글인 경우) |

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
    "nickname": "뜨개초보"
  },
  "children": [],
  "createdAt": "2026-04-09T13:00:00.000Z",
  "updatedAt": "2026-04-09T13:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 요청입니다." |
| 404 | "게시글을 찾을 수 없습니다." |
| 404 | "부모 댓글을 찾을 수 없습니다." |

---

## 5.3 `PATCH /boards/:boardId/comments/:commentId`

댓글을 수정합니다. 작성자 또는 관리자만 수정 가능합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
    | commentId | string (UUID) | Yes | 댓글 ID |
- Body:

    ```json
    {
      "body": "수정된 댓글 내용입니다."
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `body` | string | Yes | 1–1000자 |

**Response (200)**

```json
{
  "id": "comment-uuid",
  "body": "수정된 댓글 내용입니다.",
  "depth": 0,
  "parentId": null,
  "likeCount": 5,
  "isLiked": true,
  "author": {
    "id": "author-uuid",
    "nickname": "뜨개초보"
  },
  "children": [],
  "createdAt": "2026-04-09T13:00:00.000Z",
  "updatedAt": "2026-04-09T14:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "댓글을 찾을 수 없습니다." |

---

## 5.4 `DELETE /boards/:boardId/comments/:commentId`

댓글을 삭제합니다. 작성자 또는 관리자만 삭제 가능합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
    | commentId | string (UUID) | Yes | 댓글 ID |
- Body: 없음

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

## 5.5 `POST /boards/:boardId/comments/:commentId/like`

댓글에 좋아요를 누릅니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
    | commentId | string (UUID) | Yes | 댓글 ID |
- Body: 없음

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
| 409 | "이미 좋아요한 댓글입니다." |

---

## 5.6 `DELETE /boards/:boardId/comments/:commentId/like`

댓글 좋아요를 취소합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | boardId | string (UUID) | Yes | 게시글 ID |
    | commentId | string (UUID) | Yes | 댓글 ID |
- Body: 없음

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
| 404 | "좋아요 기록을 찾을 수 없습니다." |
