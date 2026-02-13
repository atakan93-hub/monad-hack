# TaskForge v2 — 통합 테스트 시나리오

## 🔧 사전 준비

```bash
# 1. Vercel env 설정 (3개 추가 후 Redeploy)
NEXT_PUBLIC_ARENA_V2=0xd8a532d7b2610F15cE57385926f2D5609847309E
NEXT_PUBLIC_IDENTITY_REGISTRY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
NEXT_PUBLIC_REPUTATION_REGISTRY=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63

# 2. 테스트 계정 (Monad Mainnet)
Admin: 0x0fb4D7369b4Cc20a8F84F319B70604BD3245eB49
User:  0x70B83F0f903e5Ff3a84e6691cFcaA241448bdCA0

# 3. 컨트랙트 주소
ArenaV2:   0xd8a532d7b2610F15cE57385926f2D5609847309E
Escrow:    0x9aD2734106c1eeAAD6f173B473E7769085abd081
FORGE:     0x7A403F18Dd87C14d712C60779FDfB7F1c7697777
```

---

## 시나리오 A: ArenaV2 전체 플로우 (컨트랙트 + API + 프론트)

### 스크립트 테스트 (백엔드 + 컨트랙트)
```bash
cd monad-hack

# ArenaV2 on-chain + API sync
PRIVATE_KEY=0xd7827a85a62e40b9b8bb22e4e9184d761e0c97124140b44221a7f028865f2844 \
ARENA_V2=0xd8a532d7b2610F15cE57385926f2D5609847309E \
API_BASE=https://taskforge-monad.vercel.app \
node scripts/test-arena-v2.mjs
```

### 프론트엔드 수동 테스트 체크리스트

| # | 페이지 | 행동 | 기대 결과 | ✅ |
|---|--------|------|-----------|-----|
| A1 | `/arena` | 지갑 연결 (Admin 계정) | RainbowKit 연결, 주소 표시 | |
| A2 | `/arena` | "Create Round" 버튼 클릭 | 모달: 상금 입력 (FORGE 수량) | |
| A3 | `/arena` | 100 FORGE 입력 → 확인 | ① FORGE approve tx ② createRound tx → Round 생성 | |
| A4 | `/arena` | 새 라운드 카드 확인 | Status: "Proposing", Creator: 내 주소, 상금 표시 | |
| A5 | `/arena` | 라운드 클릭 → 토픽 제안 (3개) | proposeTopic tx 3회, DB sync 확인 | |
| A6 | `/arena` | "Advance" 버튼 (3 topics 충족) | advanceRound tx → Status: "Voting" | |
| A7 | `/arena` | 토픽에 투표 | voteForTopic tx, vote weight 표시 | |
| A8 | `/arena` | User 계정으로 전환 → 투표 | 다른 계정도 투표 가능, 누적 weight 반영 | |
| A9 | `/arena` | "Advance" 버튼 (100+ FORGE weight) | advanceRound tx → Status: "Active", 우승 토픽 표시 | |
| A10 | `/arena` | 엔트리 제출 (repo URL + 설명) | submitEntry tx, DB 저장 | |
| A11 | `/arena` | "Advance" → Judging | advanceRound tx → Status: "Judging" | |
| A12 | `/arena` | "Select Winner" (우승 토픽 제안자만) | selectWinner tx, 상금 전송, DB 완료 | |
| A13 | `/arena` | 비-제안자가 Select Winner 시도 | 버튼 비활성 또는 tx revert | |

---

## 시나리오 B: Direct Deal 플로우 (API + 프론트)

### 스크립트 테스트 (백엔드)
```bash
API_BASE=https://taskforge-monad.vercel.app \
CLIENT_ADDRESS=0x0fb4D7369b4Cc20a8F84F319B70604BD3245eB49 \
AGENT_ADDRESS=0x70B83F0f903e5Ff3a84e6691cFcaA241448bdCA0 \
node scripts/test-direct-deal.mjs
```

### 프론트엔드 수동 테스트 체크리스트

| # | 페이지 | 행동 | 기대 결과 | ✅ |
|---|--------|------|-----------|-----|
| B1 | `/dashboard/0x70B8...` | 에이전트 대시보드 접속 | 에이전트 정보 + 평판 + Direct Deal 섹션 표시 | |
| B2 | `/dashboard/0x70B8...` | "Request Direct Deal" 버튼 클릭 | DirectDealModal 열림 (금액, 설명, 기한 입력) | |
| B3 | 모달 | 500 FORGE, 설명 입력 → 생성 | POST `/api/market/direct` → deal 생성, 모달 닫힘 | |
| B4 | `/dashboard/0x70B8...` | Direct Deals 섹션 | 새 deal 카드 표시 (status: pending) | |
| B5 | Agent 지갑 연결 | Accept 클릭 | deal status → accepted | |
| B6 | Client 지갑 | Escrow createDeal → fundDeal | 기존 Escrow 플로우 연동 | |
| B7 | 모달 | Reject 클릭 (다른 deal) | deal status → rejected | |

---

## 시나리오 C: ERC-8004 Identity + Reputation (컨트랙트 + API + 프론트)

### 스크립트 테스트
```bash
PRIVATE_KEY=0xd7827a85a62e40b9b8bb22e4e9184d761e0c97124140b44221a7f028865f2844 \
API_BASE=https://taskforge-monad.vercel.app \
node scripts/test-8004.mjs
```

### 프론트엔드 수동 테스트 체크리스트

| # | 페이지 | 행동 | 기대 결과 | ✅ |
|---|--------|------|-----------|-----|
| C1 | `/dashboard/0x70B8...` | 페이지 로딩 | Identity API 호출 → 등록 여부 표시 | |
| C2 | `/dashboard/0x70B8...` | AgentIdentityCard 영역 | ① 미등록: "No identity" ② 등록: NFT ID + URI 표시 | |
| C3 | `/dashboard/0x70B8...` | ReputationScore 영역 | getSummary → 평판 점수 + 피드백 수 표시 | |
| C4 | `/dashboard/0x70B8...` | FeedbackHistory 영역 | 피드백 목록 (타임라인) 또는 "No feedback yet" | |
| C5 | `/dashboard/0x70B8...` | ValidationBadge 영역 | "Coming Soon" 배지 | |
| C6 | 별도 | Identity register tx (컨트랙트 직접) | register("ipfs://...") → agentId 발급 → C2 반영 | |
| C7 | 별도 | giveFeedback tx (컨트랙트 직접) | 피드백 기록 → C3/C4 반영 | |

---

## 시나리오 D: Market (기존 v1 — 회귀 테스트)

### 프론트엔드 수동 테스트 체크리스트

| # | 페이지 | 행동 | 기대 결과 | ✅ |
|---|--------|------|-----------|-----|
| D1 | `/market` | 페이지 로딩 | 기존 request 목록 표시 | |
| D2 | `/market` | New Request 생성 | DB 저장, 카드 노출 | |
| D3 | `/market/[id]` | 상세 페이지 | 제안 목록, Escrow 상태 표시 | |
| D4 | Escrow 플로우 | create → fund → complete → release | 전체 플로우 정상 (v1 기능 깨지지 않음) | |

---

## 시나리오 E: 크로스 기능 통합

| # | 테스트 | 기대 결과 | ✅ |
|---|--------|-----------|-----|
| E1 | Arena 우승 → Dashboard 반영 | 우승 횟수, 평판에 반영 | |
| E2 | Escrow release → Reputation feedback | giveFeedback 호출 가능 | |
| E3 | 네비게이션 | Home → Arena → Market → Dashboard 이동 정상 | |
| E4 | 지갑 미연결 상태 | 읽기 전용, 액션 버튼 비활성 | |
| E5 | 잘못된 체인 연결 | 체인 전환 프롬프트 표시 | |

---

## 🚀 자동 테스트 실행 (한 번에)

```bash
cd monad-hack

# 1. ArenaV2 (on-chain + API)
echo "=== ArenaV2 ===" && \
PRIVATE_KEY=0xd7827a85a62e40b9b8bb22e4e9184d761e0c97124140b44221a7f028865f2844 \
ARENA_V2=0xd8a532d7b2610F15cE57385926f2D5609847309E \
API_BASE=https://taskforge-monad.vercel.app \
node scripts/test-arena-v2.mjs

# 2. Direct Deal (API only)
echo "=== Direct Deal ===" && \
API_BASE=https://taskforge-monad.vercel.app \
CLIENT_ADDRESS=0x0fb4D7369b4Cc20a8F84F319B70604BD3245eB49 \
AGENT_ADDRESS=0x70B83F0f903e5Ff3a84e6691cFcaA241448bdCA0 \
node scripts/test-direct-deal.mjs

# 3. ERC-8004 (on-chain + API)
echo "=== ERC-8004 ===" && \
PRIVATE_KEY=0xd7827a85a62e40b9b8bb22e4e9184d761e0c97124140b44221a7f028865f2844 \
API_BASE=https://taskforge-monad.vercel.app \
node scripts/test-8004.mjs
```

---

## 프론트엔드 수동 테스트 순서 (추천)

1. **D1~D4** — 기존 Market 회귀 테스트 (v1 안 깨졌는지 확인)
2. **A1~A13** — ArenaV2 전체 사이클 (핵심 신기능)
3. **B1~B7** — Direct Deal (새 기능)
4. **C1~C7** — ERC-8004 Identity/Reputation (새 기능)
5. **E1~E5** — 크로스 기능 통합

총 테스트 항목: **스크립트 3개** + **프론트 수동 38개** + **통합 5개**
