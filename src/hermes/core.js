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
  
  // 이벤트 핸들러
  onSubtitle: null,
  onGloss: null,
  onStatus: null,
};

window.HermesState = HermesState;
