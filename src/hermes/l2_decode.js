// ============================================================
// Hermes L2 Decode: 디코딩 레이어
// ============================================================

const L2_Decode = {
  // 텍스트 입력 처리
  processText(text, source = 'manual') {
    window.HermesState.onStatus?.(`[L2] ${source} 입력: "${text}"`);
    window.L3_Transform.transformToGloss(text, source);
  },
  
  // 수화 영상 타임코드 처리
  processVideoTimecode(videoId, timecode) {
    const video = window.SIGN_VIDEO_SAMPLES.find(v => v.id === videoId);
    if (!video) return;
    
    // 해당 타임코드에 맞는 문장 찾기
    const entry = video.mockSentences.find(s => 
      timecode >= s.time && timecode < s.time + 4
    );
    
    if (entry) {
      const key = entry.gloss;
      if (!window.HermesState.shownGlosses.has(key)) {
        window.HermesState.shownGlosses.add(key);
        window.L5_Render.showSubtitle(entry.original, entry.easy, entry.gloss, 'video');
      }
    }
  },
  
  // 제스처 처리 (웹캠 수화)
  processGesture(gestureType) {
    const mapping = window.GESTURE_TO_GLOSS[gestureType];
    if (!mapping) return;
    
    const key = mapping.gloss;
    if (window.HermesState.shownGlosses.has(key)) return; // 반복 방지
    
    window.HermesState.shownGlosses.add(key);
    window.HermesState.onStatus?.(`[L2] 수화 인식: ${gestureType} → "${mapping.original}"`);
    window.L5_Render.showSubtitle(mapping.original, mapping.easy, mapping.gloss, 'gesture');
  }
};

window.L2_Decode = L2_Decode;
