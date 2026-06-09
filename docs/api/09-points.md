# 9. 포인트 API

## 9.1 `GET /points/wallet`

현재 로그인한 유저의 포인트 지갑 정보를 조회합니다.

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
  "id": "wallet-uuid",
  "balance": 1500,
  "totalEarned": 2000,
  "totalUsed": 500,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-09T16:00:00.000Z"
}
```

---

## 9.2 `GET /points/transactions`

현재 로그인한 유저의 포인트 거래 내역을 조회합니다.

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
    | type | string | No | 트랜잭션 유형 필터 (`EARN` \| `USE` \| `CANCEL`) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "type": "EARN",
      "status": "confirmed",
      "amount": 100,
      "description": "챌린지 완료 보상",
      "refType": "challenge",
      "refId": "challenge-uuid",
      "expiredAt": "2027-04-09T16:00:00.000Z",
      "createdAt": "2026-04-09T16:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3
  }
}
```

---

## 9.3 `POST /points/earn` (관리자/내부용)

포인트를 지급합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "memberId": "member-uuid",
      "policyId": "policy-uuid",
      "refType": "challenge",
      "refId": "challenge-uuid",
      "description": "챌린지 완료 보상"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `memberId` | string (UUID) | Yes | 대상 유저 ID |
    | `policyId` | string (UUID) | Yes | 적용할 포인트 정책 ID |
    | `refType` | string | Yes | 참조 테이블 식별자 |
    | `refId` | string (UUID) | Yes | 참조 행의 ID |
    | `description` | string | No | 트랜잭션 설명 |

**Response (200)**

```json
{
  "id": "transaction-uuid",
  "type": "EARN",
  "status": "confirmed",
  "amount": 100,
  "description": "챌린지 완료 보상",
  "newBalance": 1600,
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |
| 404 | "정책을 찾을 수 없습니다." |

---

## 9.4 `GET /points/policies` (관리자 전용)

포인트 정책 목록을 조회합니다.

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
      "id": "policy-uuid",
      "actionType": "CHALLENGE",
      "pointAmount": 100,
      "isOneTime": true,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "policy-uuid-2",
      "actionType": "WATCH",
      "pointAmount": 10,
      "isOneTime": false,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
