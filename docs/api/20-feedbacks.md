# 20. 의견함 API

유저가 서비스에 대한 의견을 보내는 API입니다. 유저는 등록만 가능하고, 조회는 관리자 전용입니다. 수정·삭제는 제공하지 않습니다.

## 20.1 `POST /feedbacks`

의견을 등록합니다.

**Request**

- Headers:


    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "body": "튜토리얼에 자막이 있으면 좋겠어요."
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `body` | string | Yes | 1–2000자 (앞뒤 공백은 제거되어 저장) |

**Response (201)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "body": "튜토리얼에 자막이 있으면 좋겠어요.",
  "createdAt": "2026-08-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "잘못된 요청입니다." |
| 401 | "인증이 필요합니다." |

---

## 20.2 `GET /feedbacks` (관리자 전용)

등록된 의견을 최신순으로 조회합니다.

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
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "body": "튜토리얼에 자막이 있으면 좋겠어요.",
      "createdAt": "2026-08-09T12:00:00.000Z",
      "memberId": "user-uuid",
      "nickname": "실뭉치장인",
      "email": "user@example.com"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 42,
    "totalPages": 3
  }
}
```

> 작성자가 삭제된 경우 `memberId` / `nickname` / `email`은 `null`입니다.

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | "인증이 필요합니다." |
| 403 | "접근 권한이 없습니다." |
