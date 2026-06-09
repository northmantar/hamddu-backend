# 13. 게시판 카테고리 관리 API (관리자 전용)

## 13.1 `POST /boards/categories`

카테고리를 생성합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Query Parameters: 없음
- Body:

    ```json
    {
      "label": "자유게시판"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `label` | string | Yes | 1–50자 |

**Response (201)**

```json
{
  "id": "category-uuid",
  "label": "자유게시판",
  "status": "enabled"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |

---

## 13.2 `PATCH /boards/categories/:categoryId`

카테고리를 수정합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | categoryId | string (UUID) | Yes | 카테고리 ID |
- Body:

    ```json
    {
      "label": "수정된 카테고리명",
      "status": "disabled"
    }
    ```

    | 필드 | 타입 | 필수 | 유효성 조건 |
    | --- | --- | --- | --- |
    | `label` | string | No | 1–50자 |
    | `status` | string | No | `enabled` \| `disabled` |

**Response (200)**

```json
{
  "id": "category-uuid",
  "label": "수정된 카테고리명",
  "status": "disabled"
}
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "카테고리를 찾을 수 없습니다." |

---

## 13.3 `DELETE /boards/categories/:categoryId`

카테고리를 삭제합니다 (관리자 전용).

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
- Path Parameters:

    | **파라미터** | **타입** | **필수** | **설명** |
    | --- | --- | --- | --- |
    | categoryId | string (UUID) | Yes | 카테고리 ID |
- Body: 없음

**Response (204)**

```
No Content
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 403 | "접근 권한이 없습니다." |
| 404 | "카테고리를 찾을 수 없습니다." |
