# 11. 어드민 인증 API

## 11.1 `POST /auth/admin/login`

어드민 이메일/비밀번호로 로그인합니다.

**Request**

- Headers: 없음
- Query Parameters: 없음
- Body:

    ```json
    {
      "email": "admin@example.com",
      "password": "password123!"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `email` | string | Yes | 유효한 이메일 형식 |
    | `password` | string | Yes | 최소 8자 |

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "type": "admin"
  }
}
```

```
Set-Cookie: refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 401 | "이메일 또는 비밀번호가 올바르지 않습니다." |

---

## 11.2 `POST /auth/admin/set-password`

어드민 비밀번호를 최초 설정합니다. 비밀번호가 아직 설정되지 않은 어드민 계정에서만 사용 가능합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "password": "password123!"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `password` | string | Yes | 최소 8자, 영문+숫자 필수 |

**Response (200)**

```json
{
  "message": "비밀번호가 설정되었습니다."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "이미 비밀번호가 설정되어 있습니다." |
| 400 | "비밀번호는 영문과 숫자를 모두 포함해야 합니다." |
| 403 | "어드민 권한이 필요합니다." |

---

## 11.3 `PATCH /auth/admin/change-password`

어드민 비밀번호를 변경합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "currentPassword": "oldPassword123!",
      "newPassword": "newPassword456!"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `currentPassword` | string | Yes | 현재 비밀번호 |
    | `newPassword` | string | Yes | 최소 8자, 영문+숫자 필수 |

**Response (200)**

```json
{
  "message": "비밀번호가 변경되었습니다."
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "비밀번호가 설정되지 않았습니다." |
| 400 | "비밀번호는 영문과 숫자를 모두 포함해야 합니다." |
| 401 | "현재 비밀번호가 올바르지 않습니다." |
| 403 | "어드민 권한이 필요합니다." |
