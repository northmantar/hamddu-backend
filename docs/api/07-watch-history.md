# 7. 시청 기록 API

## 7.1 `GET /watch-history`

현재 로그인한 유저의 시청 기록 목록을 조회합니다.

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
- Body: 없음

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
    "totalCount": 15,
    "totalPages": 1
  }
}
```

---

## 7.2 `POST /watch-history`

시청 기록을 저장하거나 업데이트합니다. 이미 해당 콘텐츠에 대한 시청 기록이 있으면 업데이트됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
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
    | `contentId` | string (UUID) | Yes | 유효한 UUID |
    | `totalDuration` | number | Yes | 0 이상의 정수 (초 단위) |
    | `lastWatchedTimestamp` | string | Yes | `HH:mm:ss` 형식 |
    | `watchRate` | number | Yes | 0–100 정수 (시청 비율) |

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
| 400 | "lastWatchedTimestamp는 HH:mm:ss 형식이어야 합니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |
