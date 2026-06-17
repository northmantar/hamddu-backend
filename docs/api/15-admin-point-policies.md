# 15. 포인트 정책 관리 API (관리자 전용)

## 15.1 `POST /points/policies`

포인트 정책을 생성합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "actionType": "CHALLENGE",
      "pointAmount": 100,
      "isOneTime": true,
      "isActive": true
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `actionType` | string | Yes | `point_action_types.code` lookup에 등록된 활성 코드 (예: `WATCH`, `CHALLENGE`, `COMMENT`). 신규 코드는 `POST /points/action-types`로 추가 |
    | `pointAmount` | number | Yes | 1 이상의 정수 |
    | `isOneTime` | boolean | No | 1회성 적립 여부 (기본값: false) |
    | `isActive` | boolean | No | 활성화 여부 (기본값: true) |

**Response (201)**

```json
{
  "id": "policy-uuid",
  "actionType": "CHALLENGE",
  "pointAmount": 100,
  "isOneTime": true,
  "isActive": true,
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 15.2 `PATCH /points/policies/:id`

포인트 정책을 수정합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 정책 ID |
- Body:

    ```json
    {
      "pointAmount": 150,
      "isOneTime": false,
      "isActive": true
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `pointAmount` | number | No | 1 이상의 정수 |
    | `isOneTime` | boolean | No | 1회성 적립 여부 |
    | `isActive` | boolean | No | 활성화 여부 |

**Response (200)**

```json
{
  "id": "policy-uuid",
  "actionType": "CHALLENGE",
  "pointAmount": 150,
  "isOneTime": false,
  "isActive": true,
  "createdAt": "2026-04-09T12:00:00.000Z",
  "updatedAt": "2026-04-09T14:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "정책을 찾을 수 없습니다." |

---

## 15.3 `DELETE /points/policies/:id`

포인트 정책을 삭제합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 정책 ID |
- Body: 없음

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "정책을 찾을 수 없습니다." |
