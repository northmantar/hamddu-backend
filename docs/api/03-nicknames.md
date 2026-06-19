# 3. 닉네임 API

## 개요: `issue` vs `register`

닉네임 관련 두 POST 엔드포인트는 역할이 명확히 다릅니다.

| 구분 | `POST /nicknames/issue` | `POST /nicknames/register` |
| --- | --- | --- |
| 목적 | 랜덤 닉네임을 **생성해서 보여주기** (추천 후보) | 유저가 고른/입력한 닉네임을 **자기 계정에 확정(점유)** |
| 점유(저장) 여부 | ❌ 점유하지 않음. DB에 아무것도 쓰지 않음 | ✅ 점유함. 인증 유저의 `nickname` 컬럼에 기록 |
| 유저(row) 생성 | ❌ 생성하지 않음 | ❌ 생성하지 않음 (이미 가입된 유저의 닉네임만 변경) |
| 인증 필요 | **필요** (Bearer) | **필요** (Bearer, 본인 계정에만 반영) |
| 중복 처리 | 이미 사용 중인 닉네임은 피해서 후보를 반환 | 중복 시 숫자 접미사를 붙여 점유 (`실뭉치장인1` …) |
| 입력 | 없음 (서버가 형용사+명사 조합 생성) | `nickname` (유저가 직접 입력) |
| 반환 | `{ nickname }` (추천 닉네임) | `{ nickname }` (최종 점유된 닉네임) |

> 일반적인 흐름: `issue`/`candidates`로 후보를 보여주고 → `check`로 중복 확인 → 로그인 후 `register`(또는 `PATCH /users/me`)로 닉네임을 실제 확정합니다.
>
> 닉네임의 유일성은 DB의 `UQ_users_nickname` UNIQUE 제약으로 보장되며, 동시 요청으로 같은 닉네임이 겹쳐도 접미사 재시도를 통해 충돌 없이 처리됩니다.

---

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

랜덤 닉네임을 **생성해서 추천(보여주기)** 합니다. 서버가 형용사+명사 조합으로 닉네임을 만들어 반환만 하며, **DB에 점유하거나 유저를 생성하지 않습니다.** 이미 사용 중인 닉네임은 피해서 사용 가능한 후보를 반환합니다.

> 실제 닉네임 확정(점유)은 이 엔드포인트가 아니라 `POST /nicknames/register`(또는 `PATCH /users/me`)에서 일어납니다. 자세한 차이는 [개요: `issue` vs `register`](#개요-issue-vs-register)를 참고하세요.

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

인증된 유저가 입력한 닉네임을 **자기 계정에 점유(확정)** 합니다. 닉네임은 호출한 본인 유저의 `nickname` 컬럼에 저장되며, 이미 다른 유저가 사용 중이면 숫자 접미사를 붙여 점유합니다.

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
    | `nickname` | string | Yes | 2–30자, 한글/영문/숫자/언더스코어/공백만 허용 |

**Response (200)**

```json
{
  "nickname": "실뭉치장인"
}
```

이미 사용 중이라 접미사가 부여된 경우:

```json
{
  "nickname": "실뭉치장인1"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "닉네임은 2-30자의 한글, 영문, 숫자, 언더스코어, 공백만 허용됩니다." |
| 401 | "인증이 필요합니다." |
