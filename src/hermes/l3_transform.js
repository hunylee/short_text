// ============================================================
// Hermes L3 Transform: Gloss 변환 레이어
// ============================================================

const L3_Transform = {
  transformToGloss(text, source) {
    const easy = window.toEasyKorean ? window.toEasyKorean(text) : text;
    const gloss = window.textToGloss(easy);
    
    // 반복 방지 체크
    if (window.HermesState.shownGlosses.has(gloss)) {
      window.HermesState.onStatus?.(`[L3] 중복 Gloss 건너뜀: "${gloss}"`);
      return;
    }
    
    window.HermesState.onStatus?.(`[L3] Easy 변환: "${text}" → "${easy}"`);
    window.HermesState.onStatus?.(`[L3] Gloss 변환: "${easy}" → "${gloss}"`);
    window.L4_Route.routeGloss(text, easy, gloss, source);
  }
};

window.L3_Transform = L3_Transform;
