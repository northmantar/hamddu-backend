# 14. 신고 관리 API (관리자 전용)

## 14.1 `GET /boards/admin/reports`

전체 신고 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | status | string | No | 신고 상태 필터 (`pending` \| `resolved` \| `rejected`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "report-uuid",
      "reason": "spam",
      "description": "광고성 게시글입니다.",
      "status": "pending",
      "createdAt": "2026-04-09T12:00:00.000Z",
      "processedAt": null,
      "reporter": {
        "id": "reporter-uuid",
        "nickname": "신고자닉네임"
      },
      "board": {
        "id": "board-uuid",
        "title": "신고된 게시글 제목"
      }
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
| 403 | "접근 권한이 없습니다." |

---

## 14.2 `GET /boards/admin/:boardId/reports`

특정 게시글의 신고 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **설명** |
    | --- | --- | --- |
    | boardId | string (UUID) | 게시글 ID |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | status | string | No | 신고 상태 필터 (`pending` \| `resolved` \| `rejected`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "report-uuid",
      "reason": "harassment",
      "description": "욕설이 포함되어 있습니다.",
      "status": "pending",
      "createdAt": "2026-04-09T12:00:00.000Z",
      "processedAt": null,
      "reporter": {
        "id": "reporter-uuid",
        "nickname": "신고자닉네임"
      },
      "board": {
        "id": "board-uuid",
        "title": "신고된 게시글 제목"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 3,
    "totalPages": 1
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 14.3 `PATCH /boards/admin/reports/:reportId`

신고를 처리합니다 (승인/기각).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **설명** |
    | --- | --- | --- |
    | reportId | string (UUID) | 신고 ID |
- Query Parameters: 없음
- Body:

    ```json
    {
      "status": "resolved"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `status` | string | Yes | `resolved` \| `rejected` |

**Response (200)**

```json
{
  "id": "report-uuid",
  "reason": "spam",
  "description": "광고성 게시글입니다.",
  "status": "resolved",
  "createdAt": "2026-04-09T12:00:00.000Z",
  "processedAt": "2026-04-10T14:30:00.000Z",
  "reporter": {
    "id": "reporter-uuid",
    "nickname": "신고자닉네임"
  },
  "board": {
    "id": "board-uuid",
    "title": "신고된 게시글 제목"
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "신고를 찾을 수 없습니다." |
| 409 | "이미 처리된 신고입니다." |

**Note**: 신고를 `resolved`로 처리하면 해당 게시글이 숨김 처리됩니다.

---

## 14.4 `GET /boards/admin/comment-reports`

전체 댓글 신고 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | status | string | No | 신고 상태 필터 (`pending` \| `resolved` \| `rejected`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "report-uuid",
      "reason": "spam",
      "description": "스팸 댓글입니다.",
      "status": "pending",
      "createdAt": "2026-04-09T12:00:00.000Z",
      "processedAt": null,
      "reporter": {
        "id": "reporter-uuid",
        "nickname": "신고자닉네임"
      },
      "comment": {
        "id": "comment-uuid",
        "body": "신고된 댓글 내용",
        "boardId": "board-uuid"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 15,
    "totalPages": 1
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 14.5 `GET /boards/admin/comments/:commentId/reports`

특정 댓글의 신고 목록을 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **설명** |
    | --- | --- | --- |
    | commentId | string (UUID) | 댓글 ID |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | page | number | No | 페이지 번호 (기본값: 1) |
    | limit | number | No | 페이지당 항목 수 (기본값: 20) |
    | status | string | No | 신고 상태 필터 (`pending` \| `resolved` \| `rejected`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "report-uuid",
      "reason": "harassment",
      "description": "욕설이 포함되어 있습니다.",
      "status": "pending",
      "createdAt": "2026-04-09T12:00:00.000Z",
      "processedAt": null,
      "reporter": {
        "id": "reporter-uuid",
        "nickname": "신고자닉네임"
      },
      "comment": {
        "id": "comment-uuid",
        "body": "신고된 댓글 내용",
        "boardId": "board-uuid"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 2,
    "totalPages": 1
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 14.6 `PATCH /boards/admin/comment-reports/:reportId`

댓글 신고를 처리합니다 (승인/기각).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer (Admin) | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **설명** |
    | --- | --- | --- |
    | reportId | string (UUID) | 댓글 신고 ID |
- Query Parameters: 없음
- Body:

    ```json
    {
      "status": "resolved"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `status` | string | Yes | `resolved` \| `rejected` |

**Response (200)**

```json
{
  "id": "report-uuid",
  "reason": "spam",
  "description": "스팸 댓글입니다.",
  "status": "resolved",
  "createdAt": "2026-04-09T12:00:00.000Z",
  "processedAt": "2026-04-10T14:30:00.000Z",
  "reporter": {
    "id": "reporter-uuid",
    "nickname": "신고자닉네임"
  },
  "comment": {
    "id": "comment-uuid",
    "body": "신고된 댓글 내용",
    "boardId": "board-uuid"
  }
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "신고를 찾을 수 없습니다." |
| 409 | "이미 처리된 신고입니다." |

**Note**: 신고를 `resolved`로 처리하면 해당 댓글이 숨김 처리됩니다.
