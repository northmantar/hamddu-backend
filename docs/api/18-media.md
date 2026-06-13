# 18. 미디어 API

## 18.1 `POST /media`

프론트에서 R2에 직접 업로드한 후 CDN URL을 등록하여 미디어 레코드를 생성합니다. (서비스용 - 게시글 작성 등)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
    | Content-Type | application/json | Yes |
- Query Parameters: 없음
- Body:

    | 필드 | 타입 | 필수 | 설명 |
    | --- | --- | --- | --- |
    | `url` | string | Yes | 프론트에서 R2에 업로드 후 받은 CDN URL |
    | `mimeType` | string | No | MIME 타입 (예: image/jpeg) |

**Response (201)**

```json
{
  "id": "media-uuid",
  "url": "https://cdn.hamddu.online/media/abc123.jpg",
  "mimeType": "image/jpeg",
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Usage**

업로드된 미디어의 `id`는 다음 API에서 사용할 수 있습니다:

- `POST /boards` - 게시글 등록 시 `mediaIds` 필드 (이미지 N장 가능)

**Example (cURL)**

```bash
curl -X POST https://api.hamddu.online/api/media \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://cdn.hamddu.online/media/abc123.jpg",
    "mimeType": "image/jpeg"
  }'
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "URL은 필수입니다." |
| 400 | "유효한 URL 형식이어야 합니다." |
| 401 | "인증이 필요합니다." |

---

## 18.2 `POST /media/upload`

미디어(이미지) 파일을 백엔드 서버를 통해 R2에 업로드합니다. (관리자용 - 튜토리얼 콘텐츠 아이콘 등)

**Request**

- Headers:

    | **헤더** | **값** | **필수** |
    | --- | --- | --- |
    | Authorization | Bearer | Yes |
    | Content-Type | multipart/form-data | Yes |
- Query Parameters: 없음
- Body (multipart/form-data):

    | 필드 | 타입 | 필수 | 설명 |
    | --- | --- | --- | --- |
    | `file` | File | Yes | 업로드할 이미지 파일 |

**Response (201)**

```json
{
  "id": "media-uuid",
  "url": "https://cdn.hamddu.online/media/abc123.jpg",
  "mimeType": "image/jpeg",
  "createdAt": "2026-04-09T16:00:00.000Z"
}
```

**Usage**

업로드된 미디어의 `id`는 다음 API에서 사용할 수 있습니다:

- `POST /contents` - 콘텐츠 등록 시 `mediaId` 필드 (튜토리얼 type == 'symbol')
- `PATCH /contents/:id` - 콘텐츠 수정 시 `mediaId` 필드
- `POST /challenges` - 챌린지 등록 시 `mediaId` 필드

**Example (cURL)**

```bash
curl -X POST https://api.hamddu.online/api/media/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/image.jpg"
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "파일이 필요합니다." |
| 400 | "지원하지 않는 파일 형식입니다." |
| 401 | "인증이 필요합니다." |
| 403 | "접근 권한이 없습니다." |
| 413 | "파일 크기가 너무 큽니다." |
