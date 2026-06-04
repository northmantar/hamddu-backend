# RDB(Postgresql) 구성

## ERD

- plantuml syntax
    
    ```
    @startuml
    
    skinparam linetype ortho
    skinparam ranksep 100
    
    entity member #FFD5B4 {
      * id
      --
      * status <<enum>>
      * type <<enum>>
      * platform_user_id
      * platform
      * email
      * password
      * nickname
      * age
      * gender
      * interests
      * ability
      * survey_completed_at
      * created_at
      * withdrawn_at
    }
    
    entity channel #FAFAD2 {
      * id
      --
      * name
      * youtube_channel_id
      * added_at
    }
    
    entity content #FAFAD2 {
      * id
      --
      * channel_id
      * media_id
      --
      * youtube_video_id
      * name
      * type <<enum>>
      * interests <<enum>>
      * sort_order
      * point_applyable
      * uploaded_at
      * created_at
      * updated_at
    }
    
    entity watch_history #FAFAD2 {
      * id
      --
      * member_id
      * content_id
      --
      * total_duration
      * last_watched_timestamp
      * watch_rate
      * created_at
      * last_watched_at
    }
    
    entity challenge #FAFAD2 {
      * id
      --
      * member_id
      * content_id
      * media_id
      --
      * title
      * body
      * created_at
    }
    
    entity media #FFE4E1 {
      * id
      --
      * uploader_id
      --
      * url
      * mime_type
      * created_at
    }

    entity board_media #FFE4E1 {
      * id
      --
      * board_id
      * media_id
      --
      * sort_order
      * created_at
    }

    entity board #E1FFE1 {
      * id
      --
      * status <<enum>>
      * member_id
      * category_id
      * thumbnail_media_id
      * title
      * body
      * like_count
      * created_at
      * updated_at
      * deleted_at
    }
    
    entity board_like #E1FFE1 {
      * id
      --
      * board_id
      * member_id
      --
      * created_at
    }
    
    entity board_category #E1FFE1 {
      * id
      --
      * label
      * status <<enum>>
      * created_at
    }
    
    entity board_comment #E1FFE1 {
      * id
      --
      * board_id
      * member_id
      * parent_id
      --
      * body
      * depth
      * like_count
      * created_at
      * updated_at
      * deleted_at
    }

    entity board_comment_like #E1FFE1 {
      * id
      --
      * comment_id
      * member_id
      --
      * created_at
    }
    
    entity point_earning_policy #D2D2FF {
      * id
      --
      * action_type
      * point_amount
      * is_one_time
      * is_active
      * created_at
      * updated_at
    }
    
    entity point_wallet #D2D2FF {
      * id
      --
      * member_id
      --
      * balance
      * total_earned
      * total_used
      * created_at
      * updated_at
    }
    
    entity point_transaction #D2D2FF {
      * id
      --
      * member_id
      * policy_id
      --
      * ref_id
      * ref_type
      --
      * cancel_target_id
      --
      * type <<enum>>
      * status <<enum>>
      * description
      * amount
      * expired_at
      * created_at
    }
    
    entity point_use_detail #D2D2FF {
      * id
      --
      * use_tx_id
      * earn_tx_id
      * consumed_amount
    }
    
    entity xp_level_policy #FFDEE9 {
      * id
      --
      * level
      * xp_threshold
      * label
      * is_active
      * created_at
      * updated_at
    }
    
    entity xp_wallet #FFDEE9 {
      * id
      --
      * member_id
      * policy_id
      --
      * total_xp
      * current_level
      * xp_to_next_level
      * created_at
      * updated_at
    }
    
    entity xp_transaction #FFDEE9 {
      * id
      --
      * member_id
      * wallet_id
      * policy_id
      --
      * ref_id
      * ref_type
      --
      * amount
      * description
      * created_at
    }
    
    member ||--o{ media
    media ||--o{ board_media
    board ||--o{ board_media
    board }o--o| media : thumbnail
    content }o--o| media : symbol_icon
    challenge }o--o| media : proof_image

    channel ||--o{ content
    member ||--o{ watch_history
    member ||--o{ board
    member ||--o{ board_comment
    member ||--o{ challenge
    member ||--o{ point_wallet
    member ||--o{ point_transaction
    member ||--o| xp_wallet
    member ||--o{ xp_transaction
    xp_level_policy ||--o{ xp_wallet
    xp_wallet ||--o{ xp_transaction
    board ||--o{ board_comment
    board_comment ||--o{ board_comment : parent/child
    board_comment ||--o{ board_comment_like
    member ||--o{ board_comment_like
    board_comment ||--o{ point_transaction
    board }o--|| board_category
    board ||--o{ board_like
    content ||--o{ watch_history
    content ||--|{ challenge
    challenge ||--o{ point_transaction
    watch_history ||--o{ point_transaction
    point_wallet ||--o{ point_transaction
    point_earning_policy |o--o{ point_transaction
    point_transaction ||--o{ point_use_detail: USE:EARN = 1:0..N
    point_transaction ||--o{ point_use_detail: EARN:USE = 1:0..N
    
    @enduml
    ```
    

## 테이블 목록

### 회원 테이블 (`member`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | **`<<pkey>>`** 회원 ID |
| status | enum | 유저 상태 (`active` | `withdrawn`) |
| type | enum | 유저 유형 (`admin` | `member`) |
| platform_user_id | varchar | 플랫폼 유저 ID |
| platform | varchar | 가입 플랫폼(kakao, naver, google) |
| email | varchar | 가입 이메일(*암호화 고려) |
| name | varchar | 유저명(*암호화 고려) |
| nickname | varchar | 유저 닉네임 |
| age | enum | 유저 연령대 (`1418` ~ `50+`) |
| gender | enum | 유저 성별 (`M` | `F`) |
| interests | enum | 유저 관심사 (`crochet` | `knitting`) |
| ability | enum | 유저 실력 (`beginner` ~ `expert`) |
| survey_completed_at | timestamp | 설문 완료 일시 |
| created_at | timestamp | 유저 생성 일시 |
| withdrawn_at | timestamp | 유저 탈퇴 일시 |

### 닉네임 형용사 테이블 (`nickname_adjectives`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 형용사 ID |
| word | text | `<<unique>>` 형용사 |
| is_active | boolean | 현재 사용 여부 |

### 닉네임 명사 테이블 (`nickname_nouns`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 명사 ID |
| word | text | `<<unique>>` 명사 |
| is_active | boolean | 현재 사용 여부 |

### 채널 테이블 (`channel`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | **`<<pkey>>`** 채널 ID |
| name | varchar | 유튜브 채널명 |
| youtube_channel_id | varchar | 유튜브 채널 ID/slug |
| added_at | timestamp | 채널 추가 일시 |

### 콘텐츠 테이블 (`content`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | **`<<pkey>>`** 콘텐츠 ID |
| channel_id | varchar | 콘텐츠 업로드 채널 ID/slug |
| media_id | uuid | 기호 버튼 이미지 미디어 ID (nullable, symbol 타입에만 사용) |
| youtube_video_id | varchar | 유튜브 비디오 ID |
| name | varchar | 영상 제목 |
| type | enum | 영상 유형 (`symbol` \| `free` \| `normal`) |
| interests | enum | 콘텐츠 분류 (`crochet` \| `knitting`) |
| sort_order | integer | interests 내 정렬 순서 (1부터 시작, 튜토리얼만 해당) |
| point_applyable | boolean | 포인트 지급 여부(*기법 튜토리얼만 해당) |
| uploaded_at | timestamp | 콘텐츠 업로드 일시 |
| created_at | timestamp | 콘텐츠 추가 일시 |
| updated_at | timestamp | 콘텐츠 수정 일시 |

### 인증 게시글 테이블 (`challenge`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 인증 게시글 ID |
| member_id | uuid_short() | 게시글 업로드 유저 ID |
| content_id | uuid_short() | 인증 전 시청한 콘텐츠 ID |
| media_id | uuid | 인증 이미지 미디어 ID (nullable, `POST /media/upload` 응답의 id) |
| title | text | 인증 게시글 제목(*기획에 없어도 유지) |
| body | text | 인증 게시글 내용(*기획에 없어도 유지) |
| created_at | timestamp | 인증 게시글 작성 일시 |

### 미디어 테이블 (`media`)

파일 원본은 Cloudflare R2 버킷에 저장되며, `url` 컬럼에는 `CDN_BASE_URL/media/{timestamp}-{filename}` 형식의 CDN 공개 URL이 기록됩니다.

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 미디어 ID |
| uploader_id | uuid_short() | 업로드한 유저 ID (탈퇴 시 NULL) |
| url | text | Cloudflare R2에 업로드된 파일의 CDN 공개 URL |
| mime_type | varchar(100) | MIME 타입 (예: `image/jpeg`, `image/png`) |
| created_at | timestamp | 업로드 일시 |

### 게시글-미디어 연결 테이블 (`board_media`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` ID |
| board_id | uuid_short() | 게시글 ID |
| media_id | uuid_short() | 미디어 ID |
| sort_order | integer | 이미지 노출 순서 (0부터 시작) |
| created_at | timestamp | 연결 생성 일시 |
- 게시글 삭제 시 cascade 삭제
- 미디어 삭제 시 cascade 삭제

### 게시글 테이블 (`board`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 게시글 ID |
| status | enum | 게시글 상태 (`draft` \| `published` \| `deleted`) |
| member_id | uuid_short() | 게시글 업로드 유저 ID |
| category_id | uuid_short() | 게시글 카테고리 ID |
| thumbnail_media_id | uuid_short() | 대표 이미지 미디어 ID (nullable) |
| title | text | 게시글 타이틀 |
| body | text | 게시글 내용 |
| like_count | integer | 좋아요 수 |
| created_at | timestamp | 게시글 작성 일시 |
| updated_at | timestamp | 게시글 수정 일시 |
| deleted_at | timestamp | 게시글 삭제 일시 (논리삭제) |

### 게시글 카테고리 테이블 (`board_category`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 게시글 카테고리 ID |
| label | varchar | 카테고리명 |
| status | enum | 카테고리 상태 (`enabled` | `disabled`) |
| created_at | timestamp | 카테고리 생성 일시 |

### 게시글 댓글 테이블 (`board_comment`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 게시글 댓글 ID |
| board_id | uuid_short() | 소속 게시글 ID |
| member_id | uuid_short() | 댓글 작성 유저 ID |
| parent_id | uuid_short() | 부모 댓글 ID (대댓글인 경우, 루트 댓글이면 null) |
| body | text | 댓글 내용 |
| depth | integer | 댓글 깊이 (0: 루트 댓글, 1: 대댓글) |
| like_count | integer | 좋아요 수 |
| created_at | timestamp | 댓글 작성 일시 |
| updated_at | timestamp | 댓글 수정 일시 |
| deleted_at | timestamp | 댓글 삭제 일시 (논리삭제) |

### 게시글 댓글 좋아요 테이블 (`board_comment_like`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 댓글 좋아요 ID |
| comment_id | uuid_short() | 댓글 ID |
| member_id | uuid_short() | 좋아요 액션을 수행한 유저 ID |
| created_at | timestamp | 좋아요 액션 수행 일시 |

### 게시글 좋아요 테이블 (`board_like`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 게시글 좋아요 ID |
| board_id | uuid_short() | 게시글 ID |
| member_id | uuid_short() | 좋아요 액션을 수행한 유저 ID |
| created_at | timestamp | 좋아요 액션 수행 일시 |

### 유튜브 시청 기록 테이블 (`watch_history`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>` 시청기록 ID |
| member_id | uuid_short() | 콘텐츠 시청 유저 ID |
| content_id | uuid_short() | 콘텐츠 ID |
| total_duration | integer | 전체 영상 길이 |
| last_watched_timestamp | time | 마지막으로 시청한 타임스탬프 (HH:mm:ss) |
| watch_rate | integer | 시청 비율 (썸네일에 시청 기록 표시하기 위함.) |
| created_at | timestamp | 최초 시청 일시 |
| last_watched_at | timestamp | 마지막 시청 일시 |

### 포인트 정책 테이블 (`point_earning_policy`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 정책 ID |
| action_type | enum | 포인트 적립 액션 유형 (`WATCH` | `CHALLENGE` | `COMMENT`) |
| point_amount | integer | 지급 포인트량 |
| is_one_time | boolean | 최초 1회 적립 여부 (action_type이 `WATCH`인 경우 true) |
| is_active | boolean | 정책 유효여부 |
| created_at | timestamp | 정책 생성 일시 |
| updated_at | timestamp | 정책 수정 일시 |

### 회원별 포인트 잔액 관리 테이블 (`point_wallet`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 잔액 이력 ID |
| member_id | uuid_short() | 연관 유저 ID |
| balance | integer | 잔액 |
| total_earned | integer | 전체 적립액 (누계) |
| total_used | integer | 전체 사용액 (누계) |
| created_at | timestamp | 잔액 이력 생성 일시 |
| updated_at | timestamp | 잔액 이력 업데이트 일시 |

### 포인트 트랜잭션 테이블 (`point_transaction`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 트랜잭션 ID |
| member_id | uuid_short() | 트랜잭션 주체 유저 ID |
| policy_id | uuid_short() | 포인트 정책 ID |
| ref_id | uuid_short() | 참조 행의 ID (포인트 적립 행위와 연관된 테이블의 key) |
| ref_type | varchar | 참조 테이블 식별자 (포인트 적립 행위와 연관된 테이블의 레이블) |
| cancel_target_id | uuid_short() | 취소 시 원래 트랜잭션 ID |
| type | enum | 트랜잭션 유형 (`EARN` | `USE` | `CANCEL`) |
| status | enum | 트랜잭션 상태 (`COMPLETED` | `CANCEL`) |
| description | text | 트랜잭션 설명 |
| amount | integer | 트랜잭션 포인트량 (양수: 적립, 음수: 사용) |
| expired_at | timestamp | 포인트 만료 일시 (type이 `EARN` 인 경우에만 설정됨.) |
| created_at | timestamp | 트랜잭션 발생 일시 |
- ref_id + ref_type을 활용하여 다형성 구현
- 포인트 적립 행위에 대한 여러가지 유형이 추가되어도 해당 유형의 컬럼을 계속 추가하지 않을 수 있음.
- 참고: https://ws-pace.tistory.com/175

### 포인트 사용 상세 테이블 (`point_use_detail`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 사용 상세내역 ID |
| use_tx_id | uuid_short() | `USE` 트랜잭션 ID (`EARN` 트랜잭션과 1:N 관계) |
| earn_tx_id | uuid_short() | `EARN` 트랜잭션 ID (`USE` 트랜잭션과 1:N 관계) |
| consumed_amount | integer | 해당 `EARN` 트랜잭션으로 적립된 값 중 소진 양 |
- 포인트 사용과 적립의 M:N 관계 정립을 위한 테이블

### 경험치-레벨 정책 테이블 (`xp_level_policy`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 정책 ID |
| level | integer | 레벨 숫자 |
| xp_threshold | integer | 레벨 달성에 필요한 최소 XP |
| label | varchar | 레벨 레이블 |
| is_active | boolean | 정책 활성화 여부 |
| created_at | timestamp | 정책 생성 일시 |
| updated_at | timestamp | 정책 변경 일시 |

### 유저별 경험치 기록 테이블 (`xp_wallet`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 기록 ID |
| member_id | uuid_short() | 유저 ID |
| policy_id | uuid_short() | 현재 레벨 정책 ID |
| total_xp | integer | 누적 XP 총합 |
| current_level | integer | 현재 레벨 숫자 |
| xp_to_next_level | integer | 다음 레벨까지 남은 XP |
| created_at | timestamp | 기록 생성 일시 |
| updated_at | timestamp | 기록 변경 일시 |

### 유저별 경험치 트랜잭션 테이블 (`xp_transaction`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 트랜잭션 ID |
| member_id | uuid_short() | 유저 ID |
| wallet_id | uuid_short() | 기록 ID |
| policy_id | uuid_short() | 레벨 정책 ID |
| ref_id | uuid_short() | 참조 행의 ID (XP 적립 행위와 연관된 테이블의 key) |
| ref_type | varchar | 참조 테이블 식별자 (XP 적립 행위와 연관된 테이블의 레이블) |
| amount | integer | 트랜잭션 XP양 (양수) |
| description | text | 트랜잭션 설명 |
| created_at | timestamp | 트랜잭션 발생 일시 |

### 게시글 좋아요 테이블 (`board_like`)

| name | type | description |
| --- | --- | --- |
| id | uuid_short() | `<<pkey>>` 게시글 좋아요 ID |
| board_id | uuid_short() | 게시글 ID |
| member_id | uuid_short() | 좋아요 액션을 수행한 유저 ID |
| created_at | timestamp | 좋아요 액션 수행 일시 |
