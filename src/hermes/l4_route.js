// ============================================================
// Hermes L4 Route: 라우팅 레이어
// ============================================================

const L4_Route = {
  sentenceIndex: 0,
  
  routeGloss(original, easy, gloss, source) {
    // Gloss 큐에 추가 (반복 없음)
    if (window.HermesState.shownGlosses.has(gloss)) return;
    window.HermesState.shownGlosses.add(gloss);
    
    window.HermesState.subtitleQueue.push({ original, easy, gloss, source });
    window.HermesState.onStatus?.(`[L4] 자막 큐 추가: "${gloss}" (큐 크기: ${window.HermesState.subtitleQueue.length})`);
    
    // 큐 즉시 처리
    this.processQueue();
  },
  
  processQueue() {
    if (window.HermesState.currentSubtitle) return; // 현재 자막 표출 중이면 대기
    const item = window.HermesState.subtitleQueue.shift();
    if (item) window.L5_Render.showSubtitle(item.original, item.easy, item.gloss, item.source);
  },
  
  // 더불어숲 문장 순차 재생 (반복 없음)
  playForestSentences(startIdx = 0) {
    const sentences = window.FOREST_SENTENCES.filter(s => !window.HermesState.shownSentenceIds.has(s.id));
    if (sentences.length === 0) {
      window.HermesState.onStatus?.('[L4] 모든 문장 표출 완료');
      return;
    }
    
    let idx = 0;
    const playNext = () => {
      if (idx >= sentences.length || window.HermesState.mode !== 'forest') return;
      
      const sentence = sentences[idx++];
      window.HermesState.shownSentenceIds.add(sentence.id);
      
      window.L5_Render.showSubtitle(sentence.original, sentence.easy, sentence.gloss, 'forest');
      
      // 다음 문장은 현재 자막 지속시간 후 표출
      setTimeout(playNext, sentence.duration + 500);
    };
    
    playNext();
  }
};

window.L4_Route = L4_Route;
