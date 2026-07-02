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

XP 액션 타입(보상 카탈로그) 전체 조회. 코드·금액은 포인트와 독립이나 `(refType, refAction)`은 공유 레지스트리.

```json
{
  "data": [
    { "code": "USER_SIGNUP", "labelKo": "회원가입", "refType": "users", "refAction": "CREATE", "isActive": true, "createdAt": "...", "updatedAt": "..." },
    { "code": "WATCH", "labelKo": "튜토리얼 시청 완료", "refType": "tutorial_watch", "refAction": "CREATE", "isActive": true, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

### `GET /xp/reward-events`

계측된 보상 이벤트 레지스트리(포인트 `/points/reward-events`와 동일 목록 — 같은 emit이 두 큐로 fan-out).

---

## 16.8 `POST /xp/action-types` (관리자)

**Body**

```json
{ "code": "USER_SIGNUP", "labelKo": "회원가입", "refType": "users", "refAction": "CREATE" }
```

| 필드 | 타입 | 필수 | 유효성 |
| --- | --- | --- | --- |
| `code` | string | Yes | unique |
| `labelKo` | string | Yes | 1~100자 |
| `refType` | string | Yes | 공유 레지스트리(`GET /xp/reward-events`)에 등록된 값만 |
| `refAction` | enum | Yes | CRUD. `(refType, refAction)` 레지스트리 등록 + unique |

**Errors**

| 상태 코드 | errorMessage |
| --- | --- |
| 400 | "계측되지 않은 보상 이벤트입니다: ({refType}, {refAction}). ..." |
| 409 | "이미 존재하는 액션 코드입니다: {code}" / "이미 등록된 보상 이벤트입니다: ({refType}, {refAction}) → {code}" |

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
