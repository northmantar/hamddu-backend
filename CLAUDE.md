# CLAUDE.md

이 파일은 Claude가 Hamddu 백엔드 프로젝트에서 작업할 때 참고하는 지침서입니다.

---

## 프로젝트 개요

- **프레임워크**: NestJS + TypeORM
- **데이터베이스**: PostgreSQL (SnakeNamingStrategy 적용)
- **인증**: JWT (일반 유저 access_token 30분 / 어드민 access_token 3일, refresh_token 180일)
- **운영 환경**: Docker Compose (`app`, `app-postgres`, `app-redis`, `infisical`)
- **시크릿 관리**: Infisical (환경변수는 `.env.prod` 참조)

---

## 코드 구조

```
src/
├── entities/          # TypeORM 엔티티
├── enums/             # Enum 정의
├── {module}/          # 기능별 모듈
│   ├── dto/
│   ├── *.controller.ts
│   ├── *.service.ts
│   └── *.module.ts
└── migrations/        # DB 마이그레이션
```

---

## 자주 쓰는 명령어

### 빌드 / 테스트

```bash
npm run build       # TypeScript 컴파일
npm run test        # 전체 테스트
npm run test:cov    # 커버리지 측정
```

### 마이그레이션 (Docker 환경)

```bash
# 마이그레이션 파일만 변경된 경우 (앱 재시작 불필요)
npm run build
docker compose cp dist/migrations/. app:/app/dist/migrations/
docker compose exec --env-file .env.prod app npm run migration:run:prod

# 앱 코드도 변경된 경우 (전체 재빌드)
docker compose build app && docker compose up -d app
docker compose exec --env-file .env.prod app npm run migration:run:prod
```

### 컨테이너 운영

```bash
docker compose up -d app          # 앱 시작
docker compose restart app        # 앱 재시작
docker compose logs -f app        # 로그 확인
docker compose --env-file .env.prod up -d --build app  # 프로덕션 재빌드
```

---

## API 개발 작업

API 추가·수정·버그 수정 등 백엔드 개발 작업 시 `/hamddu-api-dev` 스킬을 참고한다.
(코드 패턴, 테스트 작성, 문서 업데이트 가이드 포함)
