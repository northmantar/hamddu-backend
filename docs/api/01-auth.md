# 1. SNS 로그인 인증 API

## 1.1 `GET /auth/google`

구글 OAuth를 시작합니다. 유저의 브라우저를 구글 로그인 페이지로 리다이렉트합니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음

**Response (302)**

```
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

---

## 1.2 `GET /auth/google/callback`

구글 OAuth 콜백 (구글이 직접 호출, 프론트엔드에서 직접 호출하지 않음)

**Request**

- Headers: 없음
- Query Parameters


    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | code | string | Yes | 구글에서 발급한 인가 코드 |
    | state | string | No | CSRF 방지용 상태값 |
- Body: 없음

**Response (302)**

```
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

---

## 1.3 `GET /auth/naver`

네이버 OAuth를 시작합니다. 유저의 브라우저를 네이버 로그인 페이지로 리다이렉트합니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음

**Response (302)**

```
Location: https://nid.naver.com/oauth2.0/authorize?...
```

---

## 1.4 `GET /auth/naver/callback`

네이버 OAuth 콜백 (네이버가 직접 호출)

**Request**

- Headers: 없음
- Query Parameters:


    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | code | string | Yes | 네이버에서 발급한 인가 코드 |
    | state | string | Yes | CSRF 방지용 상태값 |
- Body: 없음

**Response (302)**

```
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

---

## 1.5 `POST /auth/refresh`

리프레시 토큰을 사용해 새 액세스 토큰을 발급받습니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음
- Cookie: `refresh_token` (필수)

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | "유효하지 않은 리프레시 토큰입니다." |

---

## 1.6 `POST /auth/logout`

로그아웃 처리 (리프레시 토큰 무효화)

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: 없음
- Cookie: `refresh_token`

**Response (204)**

```
No Content
```
