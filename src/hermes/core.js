// ============================================================
// Hermes L0: State Management (Core)
// ============================================================

const HermesState = {
  // 표출된 Gloss 트래킹 (반복 방지)
  shownGlosses: new Set(),
  shownSentenceIds: new Set(),
  
  // 자막 큐
  subtitleQueue: [],
  currentSubtitle: null,
  
  // 현재 모드
  mode: 'idle',   // idle | forest | sign | webcam
  
  // AI Agent 설정 상태
  aiEnabled: false,
  apiKey: '',
  domain: 'church',
  exclusions: '',
  contextDepth: 5,
  recentSentences: [],
  
  // 이벤트 핸들러
  onSubtitle: null,
  onGloss: null,
  onStatus: null,
};

window.HermesState = HermesState;
