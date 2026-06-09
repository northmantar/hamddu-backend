# 18. 미디어 API

## 18.1 `POST /media/upload`

미디어(이미지) 파일을 업로드합니다.

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

- `POST /contents` - 콘텐츠 등록 시 `mediaId` 필드
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
| 413 | "파일 크기가 너무 큽니다." |
