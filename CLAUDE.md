# CLAUDE.md

이 파일은 Claude가 Hamddu 백엔드 프로젝트에서 작업할 때 참고하는 지침서입니다.

---

## 프로젝트 개요

- **프레임워크**: NestJS + TypeORM
- **데이터베이스**: PostgreSQL
- **인증**: JWT (일반 유저 access_token 30분 / 어드민 access_token 3일, refresh_token 180일)

---

## 작업 워크플로우

### 1단계: 문서 확인
작업 전 반드시 아래 문서를 읽고 기존 구조를 파악합니다.

| 문서 | 경로 | 내용 |
|------|------|------|
| DB 명세 | `docs/db-spec.md` | ERD, 테이블 구조, 관계, Enum 정의 |
| API 명세 | `docs/api-spec.md` | 공통 규칙, Enum 목록, API 요약표 |
| API 상세 | `docs/api/*.md` | 개별 API 엔드포인트 상세 명세 |

### 2단계: 코드 구현
아래 코드 패턴을 따라 구현합니다.

> **DB 변경(테이블/컬럼 추가·수정·삭제, Enum 추가)이 발생하면 반드시 마이그레이션 파일을 작성합니다.**
> 파일명 형식: `src/migrations/{timestamp}-{PascalCaseDescription}.ts`

### 3단계: 테스트 작성
Service에 대한 Jest 테스트를 작성하고 커버리지를 측정합니다.

### 4단계: 문서 업데이트
작업 완료 후 반드시 docs 내 관련 문서를 업데이트합니다.

---

## 코드 구조

```
src/
├── entities/          # TypeORM 엔티티
├── enums/             # Enum 정의
├── {module}/          # 기능별 모듈
│   ├── dto/           # DTO (Request/Response)
│   ├── *.controller.ts
│   ├── *.service.ts
│   └── *.module.ts
└── migrations/        # DB 마이그레이션
```

---

## 코드 작성 패턴

### Entity
- 파일: `src/entities/{entity-name}.entity.ts`
- 테이블명: snake_case 복수형
- FK 필드: camelCase
- 체크리스트:
  - `src/entities/index.ts`에 export 추가
  - Module의 `TypeOrmModule.forFeature([])`에 등록

```typescript
@Entity("table_name")
export class EntityName {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  foreignId: string;

  @ManyToOne(() => RelatedEntity)
  @JoinColumn({ name: "foreignId" })
  relatedEntity: RelatedEntity;

  @Column({ type: "enum", enum: SomeEnum })
  status: SomeEnum;

  @Column({ type: "boolean", default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt: Date | null;
}
```

### Enum
- 파일: `src/enums/{enum-name}.enum.ts`
- 체크리스트:
  - `src/enums/index.ts`에 export 추가
  - `docs/api-spec.md` Enum 섹션에 문서화

```typescript
export enum ReportStatus {
  PENDING = "pending",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}
```

### DTO

#### Request DTO
```typescript
export class CreateSomethingDto {
  @ApiProperty({ description: "필드 설명", example: "예시" })
  @IsEnum(SomeEnum)
  @IsNotEmpty()
  field: SomeEnum;

  @ApiPropertyOptional({ description: "선택 필드", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  optionalField?: string;
}
```

#### Response DTO (static from 메서드 필수)
```typescript
export class SomethingResponseDto {
  @ApiProperty({ example: "uuid-value" })
  id: string;

  @ApiProperty({ example: "2026-04-09T12:00:00.000Z" })
  createdAt: Date;

  static from(entity: SomeEntity): SomethingResponseDto {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
    };
  }
}
```

- 체크리스트:
  - `src/{module}/dto/index.ts`에 export 추가
  - 모든 필드에 `@ApiProperty` 적용

### Service

```typescript
@Injectable()
export class SomethingService {
  constructor(
    @InjectRepository(SomeEntity)
    private readonly someRepo: Repository<SomeEntity>,
  ) {}

  async findAll(query: QueryDto): Promise<{ data: SomeEntity[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.someRepo
      .createQueryBuilder("entity")
      .leftJoinAndSelect("entity.relation", "relation");

    if (status) {
      qb.where("entity.status = :status", { status });
    }

    qb.orderBy("entity.createdAt", "DESC");

    const [data, totalCount] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    };
  }
}
```

**에러 메시지 규칙**:
| Exception | 메시지 패턴 |
|-----------|-------------|
| `NotFoundException` | "~을(를) 찾을 수 없습니다." |
| `ForbiddenException` | "접근 권한이 없습니다." / "본인의 ~은(는) ~할 수 없습니다." |
| `ConflictException` | "이미 ~한 ~입니다." |
| `BadRequestException` | "유효하지 않은 ~입니다." |

### Controller (Swagger 데코레이터 필수)

```typescript
@ApiTags("module-name")
@ApiBearerAuth()
@Controller("endpoint")
@UseGuards(JwtAuthGuard)
export class SomeController {

  @ApiOperation({ summary: "기능 요약 설명" })
  @ApiParam({ name: "id", description: "리소스 ID" })
  @ApiResponse({ status: 200, description: "성공" })
  @ApiResponse({ status: 404, description: "리소스를 찾을 수 없음" })
  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ResponseDto> {
    const entity = await this.service.findById(id);
    return ResponseDto.from(entity);
  }

  // 관리자 전용 API
  @ApiOperation({ summary: "관리자 기능 (관리자)" })
  @Get("admin/something")
  @UseGuards(AdminGuard)
  async adminFunction(): Promise<ResponseDto[]> { }
}
```

**Swagger 필수 데코레이터**:
- `@ApiTags()` - 컨트롤러 그룹명
- `@ApiBearerAuth()` - 인증 필요 표시
- `@ApiOperation()` - 엔드포인트 설명
- `@ApiParam()` - Path 파라미터 설명
- `@ApiResponse()` - 응답 코드별 설명 (200, 201, 에러)

### Migration

- 파일: `src/migrations/{timestamp}-{Description}.ts`

```typescript
export class AddSomeFeature1749450000000 implements MigrationInterface {
  name = "AddSomeFeature1749450000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE ...`);
    await queryRunner.query(`ALTER TABLE ... ADD COLUMN ...`);
    await queryRunner.query(`CREATE INDEX ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순으로 롤백
  }
}
```

---

## 공통 패턴

### 페이지네이션 응답
```typescript
{ data: T[], meta: { page, limit, totalCount, totalPages } }
```

### 소프트 삭제
- `deletedAt` 컬럼 사용
- 조회 시 `deletedAt: IsNull()` 조건

### 숨김 처리 (신고)
- `isHidden` 컬럼 사용 (boolean, default: false)
- 조회 시 `isHidden: false` 조건

### 권한 체크
```typescript
if (entity.memberId !== memberId && user?.type !== UserType.ADMIN) {
  throw new ForbiddenException("접근 권한이 없습니다.");
}
```

---

## 작업 완료 후 문서 업데이트

### docs/db-spec.md
- ERD 다이어그램에 새 엔티티/관계 추가
- 테이블 명세 섹션에 새 테이블/컬럼 추가

### docs/api-spec.md
- Enum 섹션 업데이트
- API 요약표에 새 엔드포인트 추가

### docs/api/*.md
- 해당 섹션 파일에 새 엔드포인트 문서 추가
- Request (Headers, Params, Body)
- Response (JSON 예시)
- Errors (상태 코드 + 메시지)

---

## 테스트 코드 작성 (Jest)

### 테스트 파일 위치
- Service 테스트: `src/{module}/{service-name}.service.spec.ts`
- 파일명은 반드시 `.spec.ts`로 끝나야 함

### 테스트 구조

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('SomethingService', () => {
  let service: SomethingService;
  let someRepo: jest.Mocked<Repository<SomeEntity>>;

  // Mock 데이터 정의
  const mockEntity: Partial<SomeEntity> = {
    id: 'entity-123',
    memberId: 'user-123',
    status: SomeStatus.ACTIVE,
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    type: UserType.MEMBER,
  };

  beforeEach(async () => {
    // Mock Repository 정의
    const mockSomeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockEntity], 1]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SomethingService,
        { provide: getRepositoryToken(SomeEntity), useValue: mockSomeRepo },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        // 다른 의존성 서비스 mock
        { provide: OtherService, useValue: { someMethod: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<SomethingService>(SomethingService);
    someRepo = module.get(getRepositoryToken(SomeEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return entity if found', async () => {
      someRepo.findOne.mockResolvedValue(mockEntity as SomeEntity);

      const result = await service.findById('entity-123');

      expect(result).toEqual(mockEntity);
    });

    it('should throw NotFoundException if not found', async () => {
      someRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      someRepo.create.mockReturnValue(mockEntity as SomeEntity);
      someRepo.save.mockResolvedValue(mockEntity as SomeEntity);

      const result = await service.create({ ... });

      expect(result).toEqual(mockEntity);
      expect(someRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if duplicate', async () => {
      someRepo.findOne.mockResolvedValue(mockEntity as SomeEntity);

      await expect(service.create({ ... })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should allow owner to update', async () => {
      someRepo.findOne.mockResolvedValue(mockEntity as SomeEntity);

      await service.update('entity-123', 'user-123', { ... });

      expect(someRepo.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      someRepo.findOne.mockResolvedValue(mockEntity as SomeEntity);

      await expect(
        service.update('entity-123', 'other-user', { ... })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
```

### 테스트 케이스 작성 규칙

**필수 테스트 케이스**:
| 메서드 | 테스트 케이스 |
|--------|---------------|
| `findById` | 정상 조회, NotFoundException |
| `findAll` | 페이지네이션 동작, 필터 동작 |
| `create` | 정상 생성, 유효성 실패, 중복 ConflictException |
| `update` | 소유자 수정, 관리자 수정, 비소유자 ForbiddenException |
| `delete` | 소유자 삭제, 비소유자 ForbiddenException |

**테스트 작성 패턴**:
```typescript
describe('methodName', () => {
  it('should [expected behavior] when [condition]', async () => {
    // Arrange: mock 설정
    someRepo.findOne.mockResolvedValue(mockEntity as SomeEntity);

    // Act: 메서드 실행
    const result = await service.methodName(params);

    // Assert: 결과 검증
    expect(result).toEqual(expected);
    expect(someRepo.someMethod).toHaveBeenCalledWith(expectedArgs);
  });

  it('should throw [Exception] when [condition]', async () => {
    // Arrange
    someRepo.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(service.methodName(params)).rejects.toThrow(NotFoundException);
  });
});
```

### 테스트 실행 명령어

```bash
npm run test              # 전체 테스트 실행
npm run test:watch        # 변경 감지하며 테스트
npm run test:cov          # 커버리지 측정
```

### 커버리지 목표
- 새로 작성한 Service의 테스트 커버리지 **80% 이상** 유지
- 핵심 비즈니스 로직(create, update, delete)은 **100% 커버**

---

## 검증

```bash
npm run build     # 빌드 확인
npm run test      # 테스트 실행
npm run test:cov  # 커버리지 확인
```

### 마이그레이션 적용 (Docker 환경)

이 프로젝트는 Docker 컨테이너에서 운영됩니다. 마이그레이션 파일 작성 후 아래 순서로 적용합니다.

```bash
# 1. 로컬에서 컴파일
npm run build

# 2. 컴파일된 마이그레이션 파일만 컨테이너에 복사 (전체 재빌드 불필요)
docker compose cp dist/migrations/. app:/app/dist/migrations/

# 3. 컨테이너 내에서 마이그레이션 실행
docker compose exec --env-file .env.prod app npm run migration:run:prod
```

> 앱 코드 변경이 함께 있는 경우에는 전체 이미지 재빌드가 필요합니다.
> ```bash
> docker compose build app && docker compose up -d app
> docker compose exec --env-file .env.prod app npm run migration:run:prod
> ```

- Swagger: 서버 실행 후 `/api-docs` 접속하여 모든 엔드포인트 표시 확인

---

## 파일 체크리스트

| 작업 | 파일 |
|------|------|
| Entity | `src/entities/{name}.entity.ts`, `src/entities/index.ts` |
| Enum | `src/enums/{name}.enum.ts`, `src/enums/index.ts` |
| DTO | `src/{module}/dto/*.dto.ts`, `src/{module}/dto/index.ts` |
| Service | `src/{module}/*.service.ts` |
| **Test** | `src/{module}/*.service.spec.ts` |
| Controller | `src/{module}/*.controller.ts` |
| Module | `src/{module}/*.module.ts` |
| Migration | `src/migrations/*.ts` |
| 문서 | `docs/db-spec.md`, `docs/api-spec.md`, `docs/api/*.md` |
