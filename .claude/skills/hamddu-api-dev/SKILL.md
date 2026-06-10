  ---
  name: hamddu-api-dev
  description: Hamddu 백엔드 API 개발 워크플로우. API 추가, 기능 구현,
  엔드포인트 개발, CRUD 구현, 서비스 개발, 버그 수정, 리팩토링 요청 시 이
  스킬을 사용한다.
  ---

  NestJS + TypeORM 기반 Hamddu 백엔드 API 개발 표준 워크플로우.
  **모든 작업은 아래 4단계를 반드시 따른다.**

  ---

  ## 1단계: 문서 확인 (작업 전 필수)

  | 문서 | 경로 |
  |------|------|
  | DB 명세 (ERD, 테이블, Enum) | `docs/db-spec.md` |
  | API 명세 (공통 규칙, Enum 목록, 엔드포인트 요약) | `docs/api-spec.md` |
  | API 상세 | `docs/api/*.md` |

  ---

  ## 2단계: 코드 구현

  ### 파일 체크리스트

  | 작업 | 파일 |
  |------|------|
  | Entity | `src/entities/{name}.entity.ts` + `src/entities/index.ts` |
  | Enum | `src/enums/{name}.enum.ts` + `src/enums/index.ts` |
  | DTO | `src/{module}/dto/*.dto.ts` + `src/{module}/dto/index.ts` |
  | Service | `src/{module}/*.service.ts` |
  | Controller | `src/{module}/*.controller.ts` |
  | Module | `src/{module}/*.module.ts` |
  | Migration | `src/migrations/{timestamp}-{PascalCaseDescription}.ts` |

  ### DB 변경 시 마이그레이션 필수

  ```bash
  npm run build
  docker compose cp dist/migrations/. app:/app/dist/migrations/
  docker compose exec --env-file .env.prod app npm run migration:run:prod

  핵심 패턴

  - 에러: NotFoundException → "~을(를) 찾을 수 없습니다." / ForbiddenException
  → "접근 권한이 없습니다."
  - 페이지네이션: { data, meta: { page, limit, totalCount, totalPages } }
  - Response DTO: static from(entity) 필수
  - Controller: @ApiTags, @ApiBearerAuth, @ApiOperation, @ApiParam,
  @ApiResponse 필수
  - SnakeNamingStrategy 적용 중 → @JoinColumn({ name: "snake_case" }) 명시 필수

  ---
  3단계: 테스트 작성

  npm run test:cov

  - 신규 Service: 80% 이상
  - create/update/delete: 100%

  ---
  4단계: 문서 업데이트

  - docs/db-spec.md — ERD, 테이블 명세
  - docs/api-spec.md — Enum, API 요약표
  - docs/api/*.md — 신규 엔드포인트 상세 (Request / Response / Errors)

  ---
  최종 검증

  npm run build && npm run test