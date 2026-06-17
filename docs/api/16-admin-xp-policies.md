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

## 16.3 `GET /xp/policies` (관리자)

XP 지급 정책 목록 조회. point 지급 정책과 동일한 구조.

**Response (200)**

```json
{
  "data": [
    {
      "id": "uuid",
      "actionType": "SIGNUP",
      "actionTypeLabelKo": "회원가입",
      "xpAmount": 100,
      "isOneTime": true,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 16.4 `POST /xp/policies` (관리자)

**Body**

```json
{ "actionType": "DAILY_LOGIN", "xpAmount": 10, "isOneTime": false, "isActive": true }
```

| 필드 | 타입 | 필수 | 유효성 |
| --- | --- | --- | --- |
| `actionType` | string | Yes | `xp_action_types.code` 참조 |
| `xpAmount` | number | Yes | 1 이상 정수 |
| `isOneTime` | boolean | No | 기본 false |
| `isActive` | boolean | No | 기본 true |

---

## 16.5 `PATCH /xp/policies/:id` (관리자)

**Body** — `xpAmount`, `isOneTime`, `isActive` 부분 수정.

---

## 16.6 `DELETE /xp/policies/:id` (관리자)

정책을 비활성화 처리 (soft delete).

---

## 16.7 `GET /xp/action-types`

XP 액션 타입 lookup 전체 조회. `point_action_types`와 독립.

```json
{
  "data": [
    { "code": "SIGNUP", "labelKo": "회원가입", "isActive": true, "createdAt": "...", "updatedAt": "..." },
    { "code": "DAILY_LOGIN", "labelKo": "일일 로그인", "isActive": true, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

## 16.8 `POST /xp/action-types` (관리자)

**Body**

```json
{ "code": "REVIEW_WRITE", "labelKo": "후기 작성" }
```

**Errors**

| 상태 코드 | errorMessage |
| --- | --- |
| 409 | "이미 존재하는 액션 코드입니다: {code}" |

---

## 16.9 `PATCH /xp/action-types/:code` (관리자)

**Body** — `labelKo`, `isActive` 부분 수정.

---

## 16.10 `DELETE /xp/action-types/:code` (관리자)

해당 코드를 참조하는 정책이 있으면 409.

---

## 16.11 `DELETE /xp/levels/:id`

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
