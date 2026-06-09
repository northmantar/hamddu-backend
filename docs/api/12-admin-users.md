# 12. 유저 관리 API (관리자 전용)

## 12.1 `POST /users`

유저를 생성합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "email": "user@example.com",
      "password": "Password123!",
      "type": "member"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `email` | string | Yes | 유효한 이메일 형식 |
    | `password` | string | Yes | 최소 8자 |
    | `type` | string | No | `member` \| `admin` (기본값: `member`) |

**Response (201)**

```json
{
  "id": "user-uuid",
  "status": "active",
  "type": "member",
  "platform": null,
  "email": "user@example.com",
  "name": null,
  "nickname": null,
  "age": null,
  "gender": null,
  "interests": null,
  "ability": null,
  "surveyCompleted": false,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 409 | "이미 존재하는 이메일입니다." |

---

## 12.2 `GET /users`

유저 목록을 조회합니다 (관리자 전용).

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
      "id": "user-uuid-1",
      "status": "active",
      "type": "member",
      "platform": "google",
      "email": "user1@example.com",
      "name": "홍길동",
      "nickname": "실뭉치장인",
      "age": "2529",
      "gender": "F",
      "interests": "knitting",
      "ability": "intermediate",
      "surveyCompleted": true,
      "createdAt": "2026-04-01T00:00:00.000Z"
    },
    {
      "id": "user-uuid-2",
      "status": "active",
      "type": "admin",
      "platform": null,
      "email": "admin@example.com",
      "name": null,
      "nickname": null,
      "age": null,
      "gender": null,
      "interests": null,
      "ability": null,
      "surveyCompleted": false,
      "createdAt": "2026-03-15T00:00:00.000Z"
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
| 403 | "접근 권한이 없습니다." |

---

## 12.3 `PATCH /users/:id/role`

유저의 역할(타입)을 변경합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 유저 ID |
- Body:

    ```json
    {
      "type": "admin"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `type` | string | Yes | `memberType` enum 값 (`member` \| `admin`) |

**Response (200)**

```json
{
  "id": "user-uuid",
  "status": "active",
  "type": "admin",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |
