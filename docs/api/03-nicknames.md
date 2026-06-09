# 3. 닉네임 API

## 3.1 `GET /nicknames/check`

닉네임 중복 여부를 확인합니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | value | string | Yes | 확인할 닉네임 |
- Body: 없음

**Response (200)**

```json
{
  "isTaken": false
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `isTaken` | boolean | `true`: 이미 사용 중, `false`: 사용 가능 |

---

## 3.2 `GET /nicknames/candidates`

닉네임 후보 목록을 조회합니다. 시퀀스를 소비하지 않습니다.

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | count | number | No | 반환할 후보 수 (최대 20, 기본값 10) |
- Body: 없음

**Response (200)**

```json
["포근한 실뭉치", "따뜻한 바늘", "부드러운 털실"]
```

---

## 3.3 `POST /nicknames/issue`

닉네임을 자동 발급합니다. 서버가 닉네임을 생성하여 즉시 등록합니다.

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
  "nickname": "포근한 실뭉치"
}
```

---

## 3.4 `POST /nicknames/register`

닉네임을 직접 등록합니다. 중복 시 숫자 접미사가 부여됩니다.

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
  "nickname": "실뭉치장인"
}
```

중복 시:

```json
{
  "nickname": "실뭉치장인_1"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "닉네임은 2-30자의 한글, 영문, 숫자, 언더스코어만 허용됩니다." |
