#!/bin/bash

# ============================================
# 어드민 API 테스트 스크립트
# ============================================
# 사용법:
#   chmod +x test/admin-api-test.sh
#   ./test/admin-api-test.sh
# ============================================

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 헬퍼 함수
print_header() {
  echo ""
  echo -e "${BLUE}============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================${NC}"
}

print_test() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# API 호출 함수
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4

  if [ -n "$auth" ]; then
    if [ -n "$data" ]; then
      curl -s -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $auth" \
        -d "$data"
    else
      curl -s -X "$method" "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $auth"
    fi
  else
    if [ -n "$data" ]; then
      curl -s -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data"
    else
      curl -s -X "$method" "$BASE_URL$endpoint"
    fi
  fi
}

# ============================================
# 테스트 시작
# ============================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      어드민 API 테스트 스크립트            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

# 서버 상태 확인
print_header "0. 서버 상태 확인"
print_test "GET /"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "404" ]; then
  print_success "서버 실행 중 (HTTP $HEALTH)"
else
  print_error "서버가 실행되지 않았습니다. 먼저 서버를 실행하세요: npm run start:dev"
  exit 1
fi

# ============================================
# 1. 어드민 로그인 테스트
# ============================================
print_header "1. 어드민 로그인"

# 먼저 토큰이 설정되어 있는지 확인
if [ -z "$ADMIN_TOKEN" ]; then
  echo ""
  echo -e "${YELLOW}⚠ 어드민 토큰이 필요합니다.${NC}"
  echo ""
  echo "토큰 획득 방법:"
  echo "  1. 브라우저에서 $BASE_URL/auth/google 접속하여 OAuth 로그인"
  echo "  2. 리다이렉트된 URL에서 accessToken 복사"
  echo "  3. 아래에 토큰 입력"
  echo ""
  read -p "어드민 토큰을 입력하세요 (없으면 Enter): " ADMIN_TOKEN

  if [ -z "$ADMIN_TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}토큰 없이 공개 API만 테스트합니다.${NC}"
  fi
fi

# ============================================
# 2. 게시판 카테고리 테스트
# ============================================
print_header "2. 게시판 카테고리 API"

print_test "GET /boards/categories - 카테고리 목록 조회"
CATEGORIES=$(api_call GET "/boards/categories" "" "$ADMIN_TOKEN")
echo "$CATEGORIES" | head -c 500
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  print_test "POST /boards/categories - 카테고리 생성"
  CREATE_CAT=$(api_call POST "/boards/categories" '{"label":"테스트 카테고리"}' "$ADMIN_TOKEN")
  echo "$CREATE_CAT"

  CATEGORY_ID=$(echo "$CREATE_CAT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$CATEGORY_ID" ]; then
    print_success "카테고리 생성 완료: $CATEGORY_ID"

    print_test "PATCH /boards/categories/$CATEGORY_ID - 카테고리 수정"
    UPDATE_CAT=$(api_call PATCH "/boards/categories/$CATEGORY_ID" '{"label":"수정된 카테고리"}' "$ADMIN_TOKEN")
    echo "$UPDATE_CAT"

    print_test "DELETE /boards/categories/$CATEGORY_ID - 카테고리 삭제"
    DELETE_CAT=$(api_call DELETE "/boards/categories/$CATEGORY_ID" "" "$ADMIN_TOKEN")
    echo "삭제 완료 (204 No Content)"
  fi
fi

# ============================================
# 3. 포인트 정책 테스트
# ============================================
print_header "3. 포인트 정책 API"

print_test "GET /points/policies - 정책 목록 조회"
POLICIES=$(api_call GET "/points/policies" "" "$ADMIN_TOKEN")
echo "$POLICIES" | head -c 500
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  print_test "POST /points/policies - 정책 생성 (WATCH)"
  CREATE_POL=$(api_call POST "/points/policies" '{"actionType":"WATCH","pointAmount":100,"isOneTime":false,"isActive":true}' "$ADMIN_TOKEN")
  echo "$CREATE_POL"

  POLICY_ID=$(echo "$CREATE_POL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$POLICY_ID" ]; then
    print_success "정책 생성 완료: $POLICY_ID"

    print_test "PATCH /points/policies/$POLICY_ID - 정책 수정"
    UPDATE_POL=$(api_call PATCH "/points/policies/$POLICY_ID" '{"pointAmount":150}' "$ADMIN_TOKEN")
    echo "$UPDATE_POL"

    print_test "DELETE /points/policies/$POLICY_ID - 정책 삭제"
    DELETE_POL=$(api_call DELETE "/points/policies/$POLICY_ID" "" "$ADMIN_TOKEN")
    echo "삭제 완료 (204 No Content)"
  fi
fi

# ============================================
# 4. XP 레벨 정책 테스트
# ============================================
print_header "4. XP 레벨 정책 API"

print_test "GET /xp/levels - 레벨 목록 조회"
LEVELS=$(api_call GET "/xp/levels" "" "$ADMIN_TOKEN")
echo "$LEVELS" | head -c 500
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  print_test "POST /xp/levels - 레벨 생성"
  CREATE_LVL=$(api_call POST "/xp/levels" '{"level":99,"minXp":99999,"maxXp":999999,"label":"테스트레벨"}' "$ADMIN_TOKEN")
  echo "$CREATE_LVL"

  LEVEL_ID=$(echo "$CREATE_LVL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$LEVEL_ID" ]; then
    print_success "레벨 생성 완료: $LEVEL_ID"

    print_test "PATCH /xp/levels/$LEVEL_ID - 레벨 수정"
    UPDATE_LVL=$(api_call PATCH "/xp/levels/$LEVEL_ID" '{"label":"수정된레벨"}' "$ADMIN_TOKEN")
    echo "$UPDATE_LVL"

    print_test "DELETE /xp/levels/$LEVEL_ID - 레벨 삭제"
    DELETE_LVL=$(api_call DELETE "/xp/levels/$LEVEL_ID" "" "$ADMIN_TOKEN")
    echo "삭제 완료 (204 No Content)"
  fi
fi

# ============================================
# 5. 채널 관리 테스트
# ============================================
print_header "5. 채널 관리 API"

print_test "GET /channels - 채널 목록 조회"
CHANNELS=$(api_call GET "/channels" "" "$ADMIN_TOKEN")
echo "$CHANNELS" | head -c 500
echo ""

if [ -n "$ADMIN_TOKEN" ]; then
  print_test "POST /channels - 채널 등록"
  CREATE_CH=$(api_call POST "/channels" '{"name":"테스트채널","youtubeChannelId":"UCtest123456"}' "$ADMIN_TOKEN")
  echo "$CREATE_CH"

  CHANNEL_ID=$(echo "$CREATE_CH" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$CHANNEL_ID" ]; then
    print_success "채널 생성 완료: $CHANNEL_ID"

    print_test "PATCH /channels/$CHANNEL_ID - 채널 수정"
    UPDATE_CH=$(api_call PATCH "/channels/$CHANNEL_ID" '{"name":"수정된채널"}' "$ADMIN_TOKEN")
    echo "$UPDATE_CH"

    print_test "DELETE /channels/$CHANNEL_ID - 채널 삭제"
    DELETE_CH=$(api_call DELETE "/channels/$CHANNEL_ID" "" "$ADMIN_TOKEN")
    echo "삭제 완료 (204 No Content)"
  fi
fi

# ============================================
# 6. 유저 관리 테스트
# ============================================
print_header "6. 유저 관리 API"

if [ -n "$ADMIN_TOKEN" ]; then
  print_test "GET /users - 유저 목록 조회"
  USERS=$(api_call GET "/users" "" "$ADMIN_TOKEN")
  echo "$USERS" | head -c 500
  echo ""

  # 첫 번째 유저 ID 추출 (어드민 본인일 가능성 높음)
  USER_ID=$(echo "$USERS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$USER_ID" ]; then
    print_success "유저 목록 조회 완료"
    echo "첫 번째 유저 ID: $USER_ID"
  fi
else
  echo -e "${YELLOW}⚠ 어드민 토큰이 필요합니다.${NC}"
fi

# ============================================
# 완료
# ============================================
print_header "테스트 완료"
echo ""
echo -e "${GREEN}모든 테스트가 완료되었습니다.${NC}"
echo ""
echo "추가 테스트:"
echo "  - 어드민 비밀번호 설정: POST /auth/admin/set-password"
echo "  - 어드민 로그인: POST /auth/admin/login"
echo "  - 유저 권한 변경: PATCH /users/:id/role"
echo ""
