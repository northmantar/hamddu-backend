# 17. 채널 API

## 17.1 `GET /channels`

채널 목록을 조회합니다. (관리자 전용 — 모든 상태의 채널 반환)

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
      "id": "channel-uuid-1",
      "name": "함뜨 공식채널",
      "platform": "youtube",
      "sourceChannelId": "UC...",
      "status": "active",
      "addedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "channel-uuid-2",
      "name": "뜨개질 장인",
      "platform": "youtube",
      "sourceChannelId": "UC...",
      "status": "inactive",
      "addedAt": "2026-02-15T00:00:00.000Z"
    }
  ]
}
```

---

## 17.2 `POST /channels` (관리자 전용)

채널을 등록합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "name": "함뜨 공식채널",
      "platform": "youtube",
      "sourceChannelId": "UC..."
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | Yes | 최대 255자 |
    | `platform` | enum | Yes | `channelPlatform` 참고 |
    | `sourceChannelId` | string | Yes | 플랫폼 채널 ID |

**Response (201)**

```json
{
  "id": "channel-uuid",
  "name": "함뜨 공식채널",
  "platform": "youtube",
  "sourceChannelId": "UC...",
  "status": "active",
  "addedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 409 | "이미 등록된 채널입니다." |

---

## 17.3 `PATCH /channels/:id` (관리자 전용)

채널 정보를 수정합니다. `status`를 `inactive`로 변경하면 해당 채널의 콘텐츠가 일반 유저 조회에서 제외됩니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 채널 ID |
- Body:

    ```json
    {
      "name": "수정된 채널명",
      "status": "inactive"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | No | 최대 255자 |
    | `status` | enum | No | `channelStatus` 참고 |

**Response (200)**

```json
{
  "id": "channel-uuid",
  "name": "수정된 채널명",
  "platform": "youtube",
  "sourceChannelId": "UC...",
  "status": "inactive",
  "addedAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "채널을 찾을 수 없습니다." |

---

## 17.4 `DELETE /channels/:id` (관리자 전용)

채널을 삭제합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 채널 ID |
- Body: 없음

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "채널을 찾을 수 없습니다." |
