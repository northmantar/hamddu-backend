# 2. 유저 관련 API

## 2.1 `GET /users/me`

현재 로그인한 유저의 프로필을 조회합니다.

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
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "type": "member",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | "인증이 필요합니다." |

---

## 2.2 `PATCH /users/me`

현재 로그인한 유저의 닉네임을 수정합니다.

**Request**

- Headers:


    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "nickname": "실뭉치장인"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `nickname` | string | Yes | 2–30자, 한글/영문/숫자/언더스코어만 허용 |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "type": "member",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "닉네임은 2-30자의 한글, 영문, 숫자, 언더스코어만 허용됩니다." |
| 409 | "이미 사용 중인 닉네임입니다." |

---

## 2.3 `POST /users/me/survey`

로그인 후 설문 답변을 저장합니다.

**Request**

- Headers:


    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "age": "2529",
      "gender": "F",
      "interests": "knitting",
      "ability": "intermediate"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `age` | string | Yes | `age` enum 값 |
    | `gender` | string | Yes | `M` \| `F` |
    | `interests` | string | Yes | `crochet` \| `knitting` |
    | `ability` | string | Yes | `ability` enum 값 |

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "type": "member",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "유효하지 않은 설문 값입니다." |

---

## 2.4 `DELETE /users/me`

회원 탈퇴 (소프트 삭제)

**Request**

- Headers:


    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body: 없음

**Response (204)**

```
No Content
```

---

## 2.5 `GET /users/:id` (관리자 전용)

특정 유저의 프로필을 조회합니다.

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
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "type": "member",
  "platform": "google",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "실뭉치장인",
  "age": "2529",
  "gender": "F",
  "interests": "knitting",
  "ability": "intermediate",
  "surveyCompleted": true,
  "createdAt": "2026-04-09T12:00:00.000Z"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "유저를 찾을 수 없습니다." |

---

## 2.6 `GET /users` (관리자 전용)

전체 유저 목록을 조회합니다.

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
    | status | string | No | 유저 상태 필터 (active \| withdrawn) |
    | type | string | No | 유저 유형 필터 (member \| admin) |
- Body: 없음

**Response (200)**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "type": "member",
      "nickname": "실뭉치장인",
      "createdAt": "2026-04-09T12:00:00.000Z"
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
