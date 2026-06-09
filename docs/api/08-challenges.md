# 8. 챌린지 API

## 8.1 `GET /challenges`

챌린지 목록을 조회합니다.

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
    | contentId | string (UUID) | No | 특정 콘텐츠에 대한 챌린지만 조회 |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "challenge-uuid",
      "title": "사슬뜨기 완성!",
      "body": "드디어 첫 작품을 완성했어요!",
      "imageUrl": "https://cdn.hamddu.online/challenges/image.jpg",
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
    "totalCount": 100,
    "totalPages": 5
  }
}
```

---

## 8.2 `GET /challenges/my`

현재 로그인한 유저의 챌린지 목록을 조회합니다.

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
      "id": "challenge-uuid",
      "title": "사슬뜨기 완성!",
      "imageUrl": "https://cdn.hamddu.online/challenges/image.jpg",
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

## 8.3 `GET /challenges/:id`

챌린지 상세를 조회합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 챌린지 ID |
- Body: 없음

**Response (200)**

```json
{
  "id": "challenge-uuid",
  "title": "사슬뜨기 완성!",
  "body": "드디어 첫 작품을 완성했어요!",
  "imageUrl": "https://cdn.hamddu.online/challenges/image.jpg",
  "content": {
    "id": "content-uuid",
    "name": "코바늘 기초 - 사슬뜨기",
    "type": "symbol"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "imageUploaded": true,
  "stampGranted": true,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 404 | "챌린지를 찾을 수 없습니다." |

---

## 8.4 `POST /challenges`

챌린지를 등록합니다 (작품 인증).

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
      "title": "사슬뜨기 완성!",
      "body": "드디어 첫 작품을 완성했어요!",
      "mediaId": "media-uuid"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `contentId` | string (UUID) | Yes | 유효한 UUID |
    | `title` | string | No | 최대 200자 |
    | `body` | string | No | 최대 2000자 |
    | `mediaId` | string (UUID) | No | 미디어 ID (POST /media/upload 응답의 id) |

**Response (201)**

```json
{
  "id": "challenge-uuid",
  "title": "사슬뜨기 완성!",
  "body": "드디어 첫 작품을 완성했어요!",
  "imageUrl": "https://cdn.hamddu.online/challenges/image.jpg",
  "content": {
    "id": "content-uuid",
    "name": "코바늘 기초 - 사슬뜨기",
    "type": "symbol"
  },
  "author": {
    "id": "author-uuid",
    "nickname": "실뭉치장인"
  },
  "imageUploaded": true,
  "stampGranted": true,
  "pointEarned": 100,
  "xpEarned": 50,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 요청입니다." |
| 404 | "콘텐츠를 찾을 수 없습니다." |
| 409 | "이미 해당 콘텐츠에 대한 챌린지를 완료했습니다." |
