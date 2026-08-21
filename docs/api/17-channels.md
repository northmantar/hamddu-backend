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

## 17.2 `GET /channels/:id`

채널 홈을 조회합니다. 소개글, 프로필·배너 이미지, 외부 링크를 함께 반환합니다.

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

**Response (200)**

```json
{
  "id": "channel-uuid",
  "name": "함뜨 공식채널",
  "platform": "youtube",
  "sourceChannelId": "UC...",
  "status": "active",
  "addedAt": "2026-01-01T00:00:00.000Z",
  "description": "코바늘과 대바늘 기초를 알려드리는 채널입니다.",
  "profileImageUrl": "https://cdn.hamddu.online/media/profile.png",
  "profileMediaId": "media-uuid-1",
  "bannerImageUrl": "https://cdn.hamddu.online/media/banner.png",
  "bannerMediaId": "media-uuid-2",
  "links": [
    { "id": "link-uuid-1", "type": "instagram", "label": null, "url": "https://instagram.com/hamddu", "sortOrder": 0, "iconUrl": "https://cdn.hamddu.online/icons/link-types/instagram.png" },
    { "id": "link-uuid-2", "type": "smartstore", "label": null, "url": "https://smartstore.naver.com/hamddu", "sortOrder": 1, "iconUrl": "https://cdn.hamddu.online/icons/link-types/smartstore.png" },
    { "id": "link-uuid-3", "type": "etc", "label": "블로그", "url": "https://blog.naver.com/hamddu", "sortOrder": 2, "iconUrl": "https://cdn.hamddu.online/icons/link-types/url.png" }
  ]
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `description` | string \| null | 채널 홈 소개글 |
| `profileImageUrl` | string \| null | 프로필 이미지 URL |
| `profileMediaId` | string \| null | 프로필 미디어 ID (어드민 수정용) |
| `bannerImageUrl` | string \| null | 배너 이미지 URL |
| `bannerMediaId` | string \| null | 배너 미디어 ID (어드민 수정용) |
| `links` | array | 외부 링크. `sortOrder` 오름차순 정렬 |

- 미등록 항목은 `null`, 링크가 없으면 빈 배열 `[]`로 반환됩니다.
- `label`은 `type`이 `etc`일 때만 채워지며, 그 외에는 보통 `null`입니다.
- `iconUrl`은 `type`에 따라 서버가 내려주는 고정 아이콘 URL입니다. `instagram`/`smartstore`/`youtube`는 각 플랫폼 원형 로고, `website`/`etc`는 공통 URL 로고(`url.png`)를 사용합니다.

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "채널을 찾을 수 없습니다." |

---

## 17.3 `POST /channels` (관리자 전용)

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

## 17.4 `PATCH /channels/:id` (관리자 전용)

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
      "status": "inactive",
      "description": "코바늘과 대바늘 기초를 알려드리는 채널입니다.",
      "profileMediaId": "media-uuid-1",
      "bannerMediaId": "media-uuid-2",
      "links": [
        { "type": "instagram", "url": "https://instagram.com/hamddu" },
        { "type": "smartstore", "url": "https://smartstore.naver.com/hamddu" },
        { "type": "etc", "url": "https://blog.naver.com/hamddu", "label": "블로그" }
      ]
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `name` | string | No | 최대 255자 |
    | `status` | enum | No | `channelStatus` 참고 |
    | `description` | string \| null | No | 최대 2000자. `null` 전달 시 소개글 삭제 |
    | `profileMediaId` | string (UUID) \| null | No | 프로필 이미지. `null` 전달 시 해제 |
    | `bannerMediaId` | string (UUID) \| null | No | 배너 이미지. `null` 전달 시 해제 |
    | `links` | array | No | 최대 20개. 아래 표 참고 |

    `links[]` 항목:

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `type` | enum | Yes | `channelLinkType` 참고 |
    | `url` | string | Yes | `http://` 또는 `https://`로 시작, 최대 2048자 |
    | `label` | string \| null | 조건부 | 최대 50자. `type`이 `etc`이면 **필수** |

    > **`links`는 전량 교체입니다.** 보낸 배열이 기존 링크를 통째로 대체하며,
    > 배열 순서가 그대로 노출 순서(`sortOrder` 0부터)가 됩니다.
    > 필드를 **생략하면** 기존 링크가 유지되고, **빈 배열 `[]`을 보내면 전부 삭제**됩니다.
    > 링크는 매번 새로 생성되므로 응답의 링크 `id`는 수정할 때마다 바뀝니다.

**Response (200)**

`GET /channels/:id`와 동일한 채널 홈 형태로 반환합니다.

```json
{
  "id": "channel-uuid",
  "name": "수정된 채널명",
  "platform": "youtube",
  "sourceChannelId": "UC...",
  "status": "inactive",
  "addedAt": "2026-01-01T00:00:00.000Z",
  "description": "코바늘과 대바늘 기초를 알려드리는 채널입니다.",
  "profileImageUrl": "https://cdn.hamddu.online/media/profile.png",
  "profileMediaId": "media-uuid-1",
  "bannerImageUrl": "https://cdn.hamddu.online/media/banner.png",
  "bannerMediaId": "media-uuid-2",
  "links": [
    { "id": "link-uuid-1", "type": "instagram", "label": null, "url": "https://instagram.com/hamddu", "sortOrder": 0, "iconUrl": "https://cdn.hamddu.online/icons/link-types/instagram.png" },
    { "id": "link-uuid-2", "type": "smartstore", "label": null, "url": "https://smartstore.naver.com/hamddu", "sortOrder": 1, "iconUrl": "https://cdn.hamddu.online/icons/link-types/smartstore.png" },
    { "id": "link-uuid-3", "type": "etc", "label": "블로그", "url": "https://blog.naver.com/hamddu", "sortOrder": 2, "iconUrl": "https://cdn.hamddu.online/icons/link-types/url.png" }
  ]
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 미디어 ID가 포함되어 있습니다." |
| 400 | "etc 타입 링크는 표시명(label)이 필요합니다." |
| 403 | "접근 권한이 없습니다." |
| 404 | "채널을 찾을 수 없습니다." |

---

## 17.5 `DELETE /channels/:id` (관리자 전용)

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
