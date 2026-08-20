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
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&refresh_token=<token>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

> 쿼리의 `refresh_token`은 쿠키를 쓸 수 없는 모바일 클라이언트용입니다. 웹은 쿠키를 쓰므로 무시하면 됩니다.

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
Location: {FRONTEND_URL}/auth/success?access_token=<jwt>&refresh_token=<token>&survey_required=<true|false>
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

> 쿼리의 `refresh_token`은 쿠키를 쓸 수 없는 모바일 클라이언트용입니다. 웹은 쿠키를 쓰므로 무시하면 됩니다.

---

## 1.5 `POST /auth/refresh`

리프레시 토큰을 사용해 새 액세스 토큰을 발급받습니다.

> **웹 vs 모바일**
> 웹은 쿠키(`refresh_token`)만 쓰면 됩니다. 모바일은 인앱 브라우저(`ASWebAuthenticationSession`)로 OAuth를 처리해 쿠키 저장소가 앱과 분리되므로, 콜백 쿼리의 `refresh_token`을 저장해 두었다가 **body로** 보냅니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body: (쿠키가 없을 때만 필요)

    ```json
    {
      "refreshToken": "a1b2c3..."
    }
    ```

    | 필드 | 타입 | 필수 | 설명 |
    | --- | --- | --- | --- |
    | `refreshToken` | string | No | 쿠키가 없을 때 사용. 쿠키가 있으면 쿠키가 우선합니다. |
- Cookie: `refresh_token` (body를 안 보낼 경우 필수)

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "d4e5f6..."
}
```

리프레시 토큰은 매 호출마다 회전됩니다. 쿠키로 요청하면 새 토큰이 `Set-Cookie`로만 내려가고 `refreshToken` 필드는 생략됩니다. **body로 요청한 경우에만** 회전된 토큰이 응답에 포함되며, 클라이언트는 이 값을 반드시 저장해야 합니다(이전 토큰은 즉시 무효).

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
- Body: (쿠키가 없을 때만 필요)

    ```json
    {
      "refreshToken": "a1b2c3..."
    }
    ```
- Cookie: `refresh_token`

**Response (204)**

```
No Content
```
