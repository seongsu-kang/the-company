/* =========================================================
   AMBIENT SPEECH DATA — Personality, Guilt, Conversations
   Role persona 기반 대사 풀 (Tier 1, 비용 $0)
   ========================================================= */

import type { ConversationTemplate } from '../types/speech';

/* ─── Layer 2: Personality Speech (idle 독백) ─── */

export const PERSONALITY_SPEECH: Record<string, string[]> = {
  cto: [
    '이 아키텍처 기술 부채 좀 줄여야 하는데...',
    'over-engineering 하지 말자. 최소한만.',
    '성능 프로파일링 결과가 좀 신경쓰이네.',
    '시스템 설계 리뷰 해야지.',
    '이거 추상화 한 층만 걷어내면 될 텐데.',
    '모니터링 대시보드 한번 볼까.',
    '코드 리뷰 큐 확인해봐야겠다.',
    '이 모듈 의존성 정리할 때 됐는데.',
  ],
  cbo: [
    '경쟁사 새 기능 나왔다던데... 분석해봐야겠다.',
    '이번 달 수익 지표 정리해야지.',
    '시장 트렌드 리포트 업데이트 할 때 됐는데.',
    '가격 전략 벤치마킹 좀 해볼까.',
    'ROI 계산 다시 해봐야겠어.',
    '경쟁사 GitHub 스타 추이 체크해볼까.',
    '런칭 타이밍 고민 중...',
    '포지셔닝 전략 다시 점검해봐야겠다.',
  ],
  pm: [
    '이 기능 정말 사용자가 원하는 걸까?',
    '백로그 정리 좀 해야 하는데...',
    'MVP 범위가 자꾸 늘어나고 있어.',
    '사용자 피드백 분석 중...',
    '우선순위 재조정이 필요할 것 같은데.',
    '스코프 크리프 경계해야지.',
    '로드맵 타임라인 맞을까...',
    '태스크 의존성 다시 확인해봐야겠다.',
  ],
  engineer: [
    '이 코드 리팩토링 하고 싶다...',
    '테스트 커버리지가 좀 낮은 것 같은데.',
    'Working code first, perfect code later.',
    'PR 리뷰 기다리는 중...',
    '이 버그 원인이 뭘까...',
    '빌드 깨진 거 아닌가?',
    '타입 에러 하나 잡아야 하는데.',
    'npm audit 한번 돌려볼까.',
  ],
  designer: [
    '이 UI 흐름 좀 어색한데...',
    '사용성 먼저, 예쁜 건 그 다음.',
    '디자인 시스템 컴포넌트 정리해야지.',
    '빠르게 두 개 만들어서 비교하자.',
    '접근성 체크리스트 돌려봐야겠다.',
    '이 인터랙션 프로토타입 해볼까.',
    '컬러 팔레트 다시 보자...',
    '여백이 좀 답답한 것 같은데.',
  ],
  qa: [
    '"동작한다"와 "정확하다"는 다른 거야.',
    '엣지 케이스 시나리오 정리 중...',
    '회귀 테스트 스위트 돌려봐야겠다.',
    '이 부분 자동화 테스트로 바꿀 수 있을 텐데.',
    '릴리즈 전 체크리스트 확인해야지.',
    '재현 가능한 버그 리포트가 중요해.',
    '크로스 브라우저 테스트 돌려봐야겠다.',
    '성능 회귀 없는지 확인해야 하는데.',
  ],
  'data-analyst': [
    '데이터 파이프라인 상태 체크 중...',
    '이상치 탐지 패턴이 재미있네.',
    '대시보드 지표 업데이트 해야지.',
    '상관관계가 인과관계는 아닌데...',
    'SQL 쿼리 최적화 여지가 있을 것 같은데.',
    '데이터 품질 점검 시간이다.',
  ],
};

/* ─── Guilt Speech (30분+ idle) ─── */

export const GUILT_SPEECH: Record<string, string[]> = {
  cto: [
    '팀한테 일을 더 줘야 하나...',
    '아키텍처 부채 정리할 시간인가.',
    '기술 로드맵 재검토 해야겠다.',
    '좀 한가한데... 뭔가 놓치고 있나?',
  ],
  cbo: [
    '시장 분석 업데이트할 시간인데...',
    '매출 리포트 준비해야 하는데 지시가 없네.',
    '경쟁사 동향 체크나 하자.',
    '비즈니스 쪽은 조용하네...',
  ],
  pm: [
    '백로그가 좀 고요한데... 기획할 게 없나?',
    '스프린트 계획 안 잡힌 지 좀 됐는데.',
    '사용자 피드백 쌓여있을 텐데 확인해야 하는데...',
    'PRD 작성할 게 없다니... 이상한데.',
  ],
  engineer: [
    '오늘 할 일이 없네... 코드 리뷰라도 할까.',
    '태스크 큐가 비어있다. 리팩토링이나 하자.',
    '혹시 내가 뭘 놓치고 있나?',
    '커밋 로그 정리나 해야겠다.',
  ],
  designer: [
    '디자인 요청이 안 오네. 자체적으로 뭐 개선할까.',
    'UI 감사(audit) 한번 돌려볼까...',
    '포트폴리오 정리나 해야겠다.',
    '컴포넌트 라이브러리 정비할까.',
  ],
  qa: [
    '테스트할 빌드가 없네. 자동화 스크립트 보강이나 할까.',
    '조용하다... 버그가 없는 건가, 못 찾은 건가.',
    '기존 테스트 시나리오 점검이나 하자.',
    '테스트 커버리지 리포트 갱신해볼까.',
  ],
  'data-analyst': [
    '분석 요청이 안 들어오네...',
    '데이터 웨어하우스 정리나 할까.',
    '과거 리포트 검증이나 해봐야겠다.',
  ],
};

/* ─── Layer 3: Conversation Templates ─── */

export const CONVERSATIONS: ConversationTemplate[] = [
  // 상사→부하: 진행 확인
  {
    id: 'sup-check-1',
    relation: 'superior-subordinate',
    minFamiliarity: 0,
    topic: 'progress',
    turns: [
      { speaker: 'A', text: '진행 상황 어때?' },
      { speaker: 'B', text: '순조롭습니다. 곧 마무리 될 것 같아요.' },
      { speaker: 'A', text: '좋아, 끝나면 알려줘.' },
    ],
  },
  {
    id: 'sup-check-2',
    relation: 'superior-subordinate',
    minFamiliarity: 20,
    topic: 'progress',
    turns: [
      { speaker: 'A', text: '오늘 뭐 하고 있어?' },
      { speaker: 'B', text: '어제 하던 거 마저 정리 중입니다.' },
    ],
  },
  // 부하→상사: 보고
  {
    id: 'sub-report-1',
    relation: 'superior-subordinate',
    minFamiliarity: 10,
    topic: 'report',
    turns: [
      { speaker: 'B', text: '아까 건 끝났습니다.' },
      { speaker: 'A', text: '수고했어. 결과 공유해줄 수 있어?' },
      { speaker: 'B', text: '네, 문서 업데이트 해놨습니다.' },
    ],
  },
  // 동료: 기술 토론
  {
    id: 'peer-tech-1',
    relation: 'peer',
    minFamiliarity: 20,
    topic: 'tech',
    turns: [
      { speaker: 'A', text: '이 부분 설계 어떻게 생각해?' },
      { speaker: 'B', text: '좀 더 단순하게 갈 수 있을 것 같은데.' },
      { speaker: 'A', text: '그래? 한번 같이 봐볼까.' },
    ],
  },
  {
    id: 'peer-tech-2',
    relation: 'peer',
    minFamiliarity: 30,
    topic: 'tech',
    turns: [
      { speaker: 'A', text: '이 라이브러리 써본 적 있어?' },
      { speaker: 'B', text: '어, 저번 프로젝트에서 써봤는데 괜찮았어.' },
    ],
  },
  // 친한 동료: 솔직 피드백
  {
    id: 'close-feedback-1',
    relation: 'peer',
    minFamiliarity: 60,
    topic: 'feedback',
    turns: [
      { speaker: 'A', text: '솔직히 말해도 돼?' },
      { speaker: 'B', text: '당연하지, 말해봐.' },
      { speaker: 'A', text: '이번 건 좀 아쉬운 것 같아. 다시 보자.' },
      { speaker: 'B', text: '...알았어. 피드백 고마워.' },
    ],
  },
  // C-Level: 전략 싱크
  {
    id: 'clevel-sync-1',
    relation: 'c-level',
    minFamiliarity: 10,
    topic: 'strategy',
    turns: [
      { speaker: 'A', text: '로드맵이랑 비즈니스 타임라인 싱크 맞춰야 할 것 같은데.' },
      { speaker: 'B', text: '동감이야. 내일까지 정리해서 공유할게.' },
    ],
  },
  {
    id: 'clevel-sync-2',
    relation: 'c-level',
    minFamiliarity: 30,
    topic: 'strategy',
    turns: [
      { speaker: 'A', text: '경쟁사 동향 공유할 게 있는데.' },
      { speaker: 'B', text: '좋아, 나도 기술 쪽 업데이트 있어.' },
      { speaker: 'A', text: '자리 잡히면 같이 정리하자.' },
    ],
  },
  // 잡담
  {
    id: 'casual-coffee',
    relation: 'any',
    minFamiliarity: 30,
    topic: 'casual',
    turns: [
      { speaker: 'A', text: '커피 한잔 할까?' },
      { speaker: 'B', text: '좋지. 오늘 좀 길어질 것 같거든.' },
    ],
  },
  {
    id: 'casual-overtime',
    relation: 'any',
    minFamiliarity: 25,
    topic: 'casual',
    turns: [
      { speaker: 'A', text: '오늘 야근인가...' },
      { speaker: 'B', text: '같이 고생하네. 힘내자.' },
    ],
  },
  {
    id: 'casual-lunch',
    relation: 'any',
    minFamiliarity: 35,
    topic: 'casual',
    turns: [
      { speaker: 'A', text: '점심 뭐 먹을까?' },
      { speaker: 'B', text: '아무거나. 요즘 맨날 같은 거 먹는 것 같아.' },
    ],
  },
  {
    id: 'casual-weekend',
    relation: 'any',
    minFamiliarity: 40,
    topic: 'casual',
    turns: [
      { speaker: 'A', text: '주말에 뭐 했어?' },
      { speaker: 'B', text: '그냥 쉬었어. 너무 피곤했거든.' },
    ],
  },
  // 베스트 파트너
  {
    id: 'bestie-1',
    relation: 'any',
    minFamiliarity: 80,
    topic: 'trust',
    turns: [
      { speaker: 'A', text: '이번 방향 좀 고민되는데...' },
      { speaker: 'B', text: '뭐가 걸려? 솔직하게 말해봐.' },
      { speaker: 'A', text: '고마워. 너한테는 말할 수 있어서 좋다.' },
    ],
  },
];
