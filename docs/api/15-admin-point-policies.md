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

---

## 15.4 액션 타입 / 보상 카탈로그 (`/points/action-types`, `/points/reward-events`)

보상 정책 v2: 정책의 `actionType`은 `point_action_types`(보상 카탈로그)를 참조하고,
카탈로그는 `(ref_type, ref_action)` = "어떤 테이블의 어떤 CRUD 이벤트"로 보상을 매칭한다. (ref/reward-policy-v2.md)

### `GET /points/action-types`

```json
{
  "data": [
    { "code": "WATCH", "labelKo": "시청", "refType": "watch_history", "refAction": "CREATE", "isActive": true, "createdAt": "...", "updatedAt": "..." },
    { "code": "BOARD_CREATE", "labelKo": "게시글 작성", "refType": "board", "refAction": "CREATE", "isActive": true, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

### `GET /points/reward-events`

계측된(emit 되는) 보상 이벤트 레지스트리. 액션 타입 생성 시 `(refType, refAction)` 선택지.

```json
{
  "data": [
    { "refType": "board", "refAction": "CREATE" },
    { "refType": "board_comment", "refAction": "CREATE" },
    { "refType": "challenge", "refAction": "CREATE" },
    { "refType": "watch_history", "refAction": "CREATE" }
  ]
}
```

### `POST /points/action-types` (관리자)

```json
{ "code": "BOARD_CREATE", "labelKo": "게시글 작성", "refType": "board", "refAction": "CREATE" }
```

| 필드 | 타입 | 필수 | 유효성 |
| --- | --- | --- | --- |
| `code` | string | Yes | 1~50자, unique |
| `labelKo` | string | Yes | 1~100자 |
| `refType` | string | Yes | `GET /points/reward-events` 에 등록된 값만 |
| `refAction` | enum | Yes | `CREATE`/`READ`/`UPDATE`/`DELETE`. `(refType, refAction)` 레지스트리 등록 + unique |

| 상태 코드 | errorMessage |
| --- | --- |
| 400 | "계측되지 않은 보상 이벤트입니다: ({refType}, {refAction}). ..." |
| 409 | "이미 존재하는 액션 코드입니다: {code}" / "이미 등록된 보상 이벤트입니다: ({refType}, {refAction}) → {code}" |

### `PATCH /points/action-types/:code` (관리자)

`labelKo`, `isActive` 부분 수정. `(ref_type, ref_action)`은 변경 불가.

### `DELETE /points/action-types/:code` (관리자)

참조 정책이 있으면 409.
