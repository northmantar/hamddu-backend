# 18. 미디어 API

## 개요: `POST /media` vs `POST /media/upload`

두 엔드포인트 모두 백엔드가 파일을 받아 R2(Cloudflare)에 업로드하고 미디어 레코드를 생성하지만, **권한과 백엔드 압축 정책**이 다릅니다.

| 구분 | `POST /media` | `POST /media/upload` |
| --- | --- | --- |
| 용도 | 서비스용 (모바일 게시글 작성 등) | 관리자용 (튜토리얼/챌린지 등) |
| 권한 | 인증 유저 | 관리자 |
| 입력 | `multipart/form-data` (`file`) | `multipart/form-data` (`file`) |
| 백엔드 압축 | ❌ 없음 (파일 그대로 R2 업로드) | ✅ sharp로 리사이즈 + JPEG 재인코딩 |
| 압축 정책 | — | 긴 변 ≤ 1200px, JPEG 품질 75, MIME `image/jpeg` 통일 |

> **압축 책임 분리:** 모바일 클라이언트(`expo-image-manipulator`)가 이미 동일한 정책으로 압축한 뒤 `POST /media`로 보내므로 백엔드는 중복 압축하지 않습니다. 어드민(웹)은 원본 파일을 그대로 업로드하므로 백엔드에서 압축합니다.

---

## 18.1 `POST /media`

서비스용 미디어 업로드 엔드포인트. 받은 파일을 **그대로** R2에 업로드합니다 (백엔드 압축 없음). 모바일 클라이언트가 사전에 압축해 보내는 것을 전제로 합니다.

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
    | `file` | File | Yes | 업로드할 이미지 파일 (클라이언트에서 사전 압축 권장) |

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
  -F "file=@/path/to/image.jpg"
```

**Errors**

| **상태 코드** | **errorMessage** |
| --- | --- |
| 400 | "파일이 필요합니다." |
| 401 | "인증이 필요합니다." |
| 413 | "파일 크기가 너무 큽니다." |

---

## 18.2 `POST /media/upload`

관리자용 미디어 업로드 엔드포인트. 받은 파일을 **백엔드에서 압축한 뒤** R2에 업로드합니다.

**압축 정책 (sharp)**

- EXIF orientation 보정 후 리사이즈
- 긴 변이 1200px를 초과하면 비율을 유지한 채 1200px로 축소 (확대는 하지 않음)
- 출력 포맷: **JPEG 품질 75** (입력이 PNG/HEIC 등이어도 모두 JPEG로 변환)
- 저장 시 MIME 타입과 파일 확장자는 `image/jpeg` / `.jpg`로 통일

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
    | `file` | File | Yes | 업로드할 이미지 파일 (원본 그대로 전송) |

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
