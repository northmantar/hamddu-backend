# 6. 콘텐츠 API

## 6.1 `GET /contents`

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
    | type | string | No | 콘텐츠 유형 필터 (`symbol` \| `free` \| `normal`) |
    | channelId | string (UUID) | No | 채널 ID 필터 |
- Body: 없음

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
    "totalCount": 50,
    "totalPages": 3
  }
}
```

---

## 6.2 `GET /contents/tutorials`

튜토리얼 콘텐츠 목록을 정렬 순서(sortOrder)대로 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | interests | string | Yes | 관심사 (`crochet` \| `knitting`) |
- Body: 없음

**Response (200)**

```json
[
  {
    "id": "content-uuid-1",
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
  },
  {
    "id": "content-uuid-2",
    "youtubeVideoId": "abc123XYZ",
    "name": "코바늘 기초 - 짧은뜨기",
    "type": "symbol",
    "channel": {
      "id": "channel-uuid",
      "name": "함뜨 공식채널"
    },
    "interests": "crochet",
    "imageUrl": "https://cdn.hamddu.online/symbols/sc.png",
    "pointApplyable": true,
    "sortOrder": 2,
    "uploadedAt": "2026-04-01T11:00:00.000Z",
    "createdAt": "2026-04-02T13:00:00.000Z"
  }
]
```

---

## 6.3 `GET /contents/:id`

콘텐츠 상세를 조회합니다. 튜토리얼(symbol) 콘텐츠인 경우 시청 기록과 챌린지 완료 여부도 포함됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 콘텐츠 ID |
- Body: 없음

**Response (200)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "pointApplyable": true,
  "sortOrder": 1,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z",
  "watchHistory": {
    "watchRate": 55,
    "lastWatchedTimestamp": "00:05:30",
    "lastWatchedAt": "2026-04-09T15:00:00.000Z"
  },
  "challengeCompleted": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

## 6.4 `POST /contents` (관리자 전용)

콘텐츠를 등록합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "channelId": "channel-uuid",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "name": "코바늘 기초 - 사슬뜨기",
      "type": "symbol",
      "interests": "crochet",
      "sortOrder": 1,
      "pointApplyable": true,
      "mediaId": "media-uuid"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `channelId` | string (UUID) | Yes | 유효한 UUID |
    | `youtubeVideoId` | string | Yes | 유튜브 비디오 ID |
    | `name` | string | Yes | 1–200자 |
    | `type` | string | Yes | `contentType` enum 값 (`symbol` \| `free` \| `normal`) |
    | `interests` | string | No | `interests` enum 값 (`crochet` \| `knitting`) |
    | `sortOrder` | number | No | 1 이상의 정수 |
    | `pointApplyable` | boolean | No | 기본값: false |
    | `mediaId` | string (UUID) | No | 미디어 ID (POST /media/upload 응답의 id) |

**Response (201)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "pointApplyable": true,
  "sortOrder": 1,
  "uploadedAt": null,
  "createdAt": "2026-04-02T12:00:00.000Z",
  "watchHistory": null,
  "challengeCompleted": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 요청입니다." |
| 403 | "접근 권한이 없습니다." |

---

## 6.5 `PATCH /contents/:id` (관리자 전용)

콘텐츠를 수정합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 콘텐츠 ID |
- Body:

    ```json
    {
      "name": "수정된 콘텐츠 제목",
      "sortOrder": 2,
      "pointApplyable": false,
      "mediaId": "new-media-uuid"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | No | 1–200자 |
    | `sortOrder` | number | No | 1 이상의 정수 |
    | `pointApplyable` | boolean | No | - |
    | `mediaId` | string (UUID) | No | 미디어 ID |

**Response (200)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "수정된 콘텐츠 제목",
  "type": "symbol",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/new-image.png",
  "pointApplyable": false,
  "sortOrder": 2,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z",
  "watchHistory": null,
  "challengeCompleted": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

## 6.6 `PATCH /contents/:id/order` (관리자 전용)

콘텐츠의 정렬 순서를 변경합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 콘텐츠 ID |
- Body:

    ```json
    {
      "sortOrder": 3
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `sortOrder` | number | Yes | 1 이상의 정수 |

**Response (200)**

```json
{
  "id": "content-uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "name": "코바늘 기초 - 사슬뜨기",
  "type": "symbol",
  "channel": {
    "id": "channel-uuid",
    "name": "함뜨 공식채널",
    "youtubeChannelId": "UC..."
  },
  "interests": "crochet",
  "imageUrl": "https://cdn.hamddu.online/symbols/chain.png",
  "pointApplyable": true,
  "sortOrder": 3,
  "uploadedAt": "2026-04-01T10:00:00.000Z",
  "createdAt": "2026-04-02T12:00:00.000Z",
  "watchHistory": null,
  "challengeCompleted": false
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "순서 변경이 불가합니다 (interests 미지정)." |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |

---

## 6.7 `DELETE /contents/:id` (관리자 전용)

콘텐츠를 삭제합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 콘텐츠 ID |
- Body: 없음

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |
