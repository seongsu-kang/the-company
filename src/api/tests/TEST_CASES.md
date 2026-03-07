# Tycono Platform — Test Coverage

> 실제 구현된 테스트 목록 및 실행 가이드

---

## 테스트 레벨 분류

| Level | 실행 환경 | LLM 호출 | 속도 |
|-------|----------|---------|------|
| **Unit** | Vitest | MockProvider | 빠름 |
| **Integration** | Vitest + HTTP | MockProvider | 중간 |
| **Live** | Vitest + HTTP | 실제 Haiku API | 느림 (env-gated) |
| **E2E** | Playwright + 브라우저 | MockProvider or Live | 느림 |

---

## 구현된 테스트 목록

### Unit Tests (10개)

| 파일 | 테스트 대상 | 설명 |
|------|------------|------|
| `org-tree.test.ts` | Organization tree | 조직도 구조 파싱 및 검증 |
| `cost-tracking.test.ts` | Cost tracking | 비용 추적 로직 (MockProvider) |
| `mock-provider.test.ts` | Mock LLM provider | MockProvider 자체 테스트 |
| `token-ledger.test.ts` | Token ledger | 토큰 사용량 기록 및 집계 |
| `activity-tracker.test.ts` | Activity tracker | 활동 로그 기록 |
| `runner-selection.test.ts` | Runner selection | Claude CLI vs Direct API 선택 로직 |
| `agent-loop.test.ts` | Agent execution loop | 에이전트 실행 루프 메커니즘 |
| `pricing.test.ts` | Pricing calculation | 모델별 가격 계산 |
| `company-config.test.ts` | Company config | CLAUDE.md 파싱 및 설정 |
| `authority-validator.test.ts` | Authority validation | Role별 권한 검증 |

### Integration Tests (3개)

| 파일 | 테스트 대상 | 설명 |
|------|------------|------|
| `activity-stream.test.ts` | Activity stream | 실시간 활동 스트림 SSE |
| `token-tracking.test.ts` | Token tracking flow | 토큰 추적 전체 플로우 |
| `dispatch-chain.test.ts` | Dispatch chain | 에이전트 간 작업 위임 체인 |

### Live Tests (1개)

| 파일 | 테스트 대상 | 설명 |
|------|------------|------|
| `cost-tracking.test.ts` | Real API cost | 실제 Anthropic API 호출 비용 추적 |

### Web E2E Tests (5개)

| 파일 | 테스트 대상 | 설명 |
|------|------------|------|
| `terminal.spec.ts` | Terminal UI | 터미널 인터페이스 동작 |
| `sidepanel.spec.ts` | Side panel | 사이드 패널 네비게이션 |
| `modals.spec.ts` | Modal dialogs | 모달 다이얼로그 (Role 생성/수정 등) |
| `office-page.spec.ts` | Office page | 오피스 메인 페이지 |
| `operations.spec.ts` | Operations flow | 운영 화면 전체 플로우 |

---

## 테스트 실행

### Unit + Integration (빠름)

```bash
# 모든 단위/통합 테스트 실행 (MockProvider)
npm test

# 특정 파일만 실행
npx vitest run tests/unit/cost-tracking.test.ts

# Watch 모드
npx vitest watch
```

### Live Tests (느림, API 키 필요)

```bash
# Live 테스트 실행 (실제 Anthropic API 호출)
ANTHROPIC_API_KEY=sk-... npx vitest run tests/live/

# 경고: 실제 비용 발생 (Haiku 사용, 소액)
```

### Web E2E Tests

```bash
# E2E 테스트 실행 (Playwright)
cd src/web
npm run test:e2e

# Headless 모드
npm run test:e2e:headless

# 특정 테스트만 실행
npx playwright test tests/e2e/terminal.spec.ts
```

---

## 테스트 커버리지

| 카테고리 | 구현 상태 |
|---------|----------|
| Core Logic (Unit) | ✅ 10개 테스트 |
| Integration Flow | ✅ 3개 테스트 |
| Live API | ✅ 1개 테스트 (cost tracking) |
| Web UI (E2E) | ✅ 5개 테스트 |
| **총계** | **19개 테스트 파일** |

---

## 테스트 전략

### 우선순위

1. **Unit Tests** — 핵심 로직의 정확성 보장 (MockProvider 사용)
2. **Integration Tests** — 컴포넌트 간 협력 검증 (HTTP + MockProvider)
3. **Live Tests** — 실제 API 동작 확인 (env-gated, 최소 실행)
4. **E2E Tests** — 사용자 시나리오 전체 플로우 (중요 경로만)

### 비용 제어

- **Unit/Integration**: MockProvider 사용 → 비용 없음
- **Live**: 실제 API 호출 → Haiku 사용, CI에서는 선택적 실행
- **E2E**: MockProvider 기본, 필요시 Live 전환

### CI/CD

```yaml
# .github/workflows/test.yml
- name: Unit + Integration
  run: npm test

- name: E2E (Mock)
  run: npm run test:e2e:headless

- name: Live (선택적, main 브랜치만)
  if: github.ref == 'refs/heads/main'
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx vitest run tests/live/
```

---

## 관련 문서

- [Test Strategy](../../../../knowledge/test-strategy.md) — 전체 테스트 전략
- [Cost Control](../../../../architecture/cost-control.md) — 비용 제어 메커니즘
- [MockProvider](../mocks/README.md) — Mock LLM 구현체

---

*작성: CTO | 2026-03-07 (30,901줄 → 150줄로 최소화)*
