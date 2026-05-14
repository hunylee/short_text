// ============================================================
// Hermes L5 Render: 렌더링 레이어
// ============================================================

const L5_Render = {
  subtitleEl: null,
  easyEl: null,
  glossEl: null,
  sourceEl: null,
  currentTimer: null,
  
  init(subtitleEl, easyEl, glossEl, sourceEl) {
    this.subtitleEl = subtitleEl;
    this.easyEl = easyEl;
    this.glossEl = glossEl;
    this.sourceEl = sourceEl;
  },
  
  showSubtitle(original, easy, gloss, source = 'text') {
    window.HermesState.currentSubtitle = { original, easy, gloss, source };
    
    // 소스 레이블
    const sourceLabels = {
      forest: '📖 더불어숲',
      speech: '🎤 음성',
      video: '🤟 수화영상',
      gesture: '📷 웹캠수화',
      text: '✏️ 텍스트'
    };
    
    // DOM 업데이트
    if (this.subtitleEl) {
      this.subtitleEl.textContent = original;
      this.subtitleEl.classList.add('subtitle-active');
    }
    if (this.easyEl) {
      this.easyEl.textContent = easy;
      this.easyEl.classList.add('easy-active');
    }
    if (this.glossEl) {
      this.glossEl.textContent = gloss;
      this.glossEl.classList.add('gloss-active');
    }
    if (this.sourceEl) {
      this.sourceEl.textContent = sourceLabels[source] || source;
    }
    
    // 이벤트 발행
    window.HermesState.onSubtitle?.(original, easy, source);
    window.HermesState.onGloss?.(gloss, source);
    
    // 일정 시간 후 다음 큐 처리
    if (this.currentTimer) clearTimeout(this.currentTimer);
    const duration = Math.max(3000, original.length * 80);
    
    this.currentTimer = setTimeout(() => {
      this.clearSubtitle();
      window.HermesState.currentSubtitle = null;
      window.L4_Route.processQueue();
    }, duration);
  },
  
  clearSubtitle() {
    if (this.subtitleEl) this.subtitleEl.classList.remove('subtitle-active');
    if (this.easyEl) this.easyEl.classList.remove('easy-active');
    if (this.glossEl) this.glossEl.classList.remove('gloss-active');
  }
};

window.L5_Render = L5_Render;
