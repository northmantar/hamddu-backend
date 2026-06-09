# 16. XP 레벨 정책 관리 API (관리자 전용)

## 16.1 `POST /xp/levels`

XP 레벨 정책을 생성합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "level": 6,
      "xpThreshold": 1500,
      "label": "중급 뜨개러",
      "isActive": true
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `level` | number | Yes | 1 이상의 정수 |
    | `xpThreshold` | number | Yes | 0 이상의 정수 (해당 레벨 도달에 필요한 누적 XP) |
    | `label` | string | Yes | 최대 100자 |
    | `isActive` | boolean | No | 활성화 여부 (기본값: true) |

**Response (201)**

```json
{
  "id": "policy-uuid",
  "level": 6,
  "xpThreshold": 1500,
  "label": "중급 뜨개러",
  "isActive": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 16.2 `PATCH /xp/levels/:id`

XP 레벨 정책을 수정합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 레벨 정책 ID |
- Body:

    ```json
    {
      "xpThreshold": 1600,
      "label": "중급 뜨개러 (수정)",
      "isActive": true
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `xpThreshold` | number | No | 0 이상의 정수 |
    | `label` | string | No | 최대 100자 |
    | `isActive` | boolean | No | 활성화 여부 |

**Response (200)**

```json
{
  "id": "policy-uuid",
  "level": 6,
  "xpThreshold": 1600,
  "label": "중급 뜨개러 (수정)",
  "isActive": true
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "정책을 찾을 수 없습니다." |

---

## 16.3 `DELETE /xp/levels/:id`

XP 레벨 정책을 삭제합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | id | string (UUID) | Yes | 레벨 정책 ID |
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
