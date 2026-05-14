// ============================================================
// Hermes Engine - 5계층 파이프라인
// L1 Source → L2 Decode → L3 Transform → L4 Route → L5 Render
// ============================================================

// 전역 객체 사용

// ─── 헤르메스 상태 관리 ─────────────────────────────────────
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

// ─── L1 Source: 입력 소스 관리 ──────────────────────────────
const L1_Source = {
  recognition: null,
  webcamStream: null,
  videoElement: null,
  
  // Web Speech API 초기화
  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ko-KR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) L2_Decode.processText(text, 'speech');
        }
      }
    };
    
    this.recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        HermesState.onStatus?.(`음성인식 오류: ${e.error}`);
      }
    };
    
    return true;
  },
  
  startSpeech() {
    if (!this.recognition && !this.initSpeech()) return false;
    try { this.recognition.start(); return true; } catch(e) { return false; }
  },
  
  stopSpeech() {
    try { this.recognition?.stop(); } catch(e) {}
  },
  
  // 웹캠 스트림
  async startWebcam(videoEl) {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoEl.srcObject = this.webcamStream;
      this.videoElement = videoEl;
      return true;
    } catch(e) {
      HermesState.onStatus?.('카메라 접근 실패: ' + e.message);
      return false;
    }
  },
  
  stopWebcam() {
    this.webcamStream?.getTracks().forEach(t => t.stop());
    this.webcamStream = null;
  }
};

// ─── L2 Decode: 디코딩 레이어 ───────────────────────────────
const L2_Decode = {
  // 텍스트 입력 처리
  processText(text, source = 'manual') {
    HermesState.onStatus?.(`[L2] ${source} 입력: "${text}"`);
    L3_Transform.transformToGloss(text, source);
  },
  
  // 수화 영상 타임코드 처리
  processVideoTimecode(videoId, timecode) {
    const video = SIGN_VIDEO_SAMPLES.find(v => v.id === videoId);
    if (!video) return;
    
    // 해당 타임코드에 맞는 문장 찾기
    const entry = video.mockSentences.find(s => 
      timecode >= s.time && timecode < s.time + 4
    );
    
    if (entry) {
      const key = entry.gloss;
      if (!HermesState.shownGlosses.has(key)) {
        HermesState.shownGlosses.add(key);
        L5_Render.showSubtitle(entry.original, entry.easy, entry.gloss, 'video');
      }
    }
  },
  
  // 제스처 처리 (웹캠 수화)
  processGesture(gestureType) {
    const mapping = GESTURE_TO_GLOSS[gestureType];
    if (!mapping) return;
    
    const key = mapping.gloss;
    if (HermesState.shownGlosses.has(key)) return; // 반복 방지
    
    HermesState.shownGlosses.add(key);
    HermesState.onStatus?.(`[L2] 수화 인식: ${gestureType} → "${mapping.original}"`);
    L5_Render.showSubtitle(mapping.original, mapping.easy, mapping.gloss, 'gesture');
  }
};

// ─── L3 Transform: Gloss 변환 레이어 ────────────────────────
const L3_Transform = {
  transformToGloss(text, source) {
    const easy = window.toEasyKorean ? window.toEasyKorean(text) : text;
    const gloss = window.textToGloss(easy);
    
    // 반복 방지 체크
    if (HermesState.shownGlosses.has(gloss)) {
      HermesState.onStatus?.(`[L3] 중복 Gloss 건너뜀: "${gloss}"`);
      return;
    }
    
    HermesState.onStatus?.(`[L3] Easy 변환: "${text}" → "${easy}"`);
    HermesState.onStatus?.(`[L3] Gloss 변환: "${easy}" → "${gloss}"`);
    L4_Route.routeGloss(text, easy, gloss, source);
  }
};

// ─── L4 Route: 라우팅 레이어 ────────────────────────────────
const L4_Route = {
  sentenceIndex: 0,
  
  routeGloss(original, easy, gloss, source) {
    // Gloss 큐에 추가 (반복 없음)
    if (HermesState.shownGlosses.has(gloss)) return;
    HermesState.shownGlosses.add(gloss);
    
    HermesState.subtitleQueue.push({ original, easy, gloss, source });
    HermesState.onStatus?.(`[L4] 자막 큐 추가: "${gloss}" (큐 크기: ${HermesState.subtitleQueue.length})`);
    
    // 큐 즉시 처리
    this.processQueue();
  },
  
  processQueue() {
    if (HermesState.currentSubtitle) return; // 현재 자막 표출 중이면 대기
    const item = HermesState.subtitleQueue.shift();
    if (item) L5_Render.showSubtitle(item.original, item.easy, item.gloss, item.source);
  },
  
  // 더불어숲 문장 순차 재생 (반복 없음)
  playForestSentences(startIdx = 0) {
    const sentences = window.FOREST_SENTENCES.filter(s => !HermesState.shownSentenceIds.has(s.id));
    if (sentences.length === 0) {
      HermesState.onStatus?.('[L4] 모든 문장 표출 완료');
      return;
    }
    
    let idx = 0;
    const playNext = () => {
      if (idx >= sentences.length || HermesState.mode !== 'forest') return;
      
      const sentence = sentences[idx++];
      HermesState.shownSentenceIds.add(sentence.id);
      
      L5_Render.showSubtitle(sentence.original, sentence.easy, sentence.gloss, 'forest');
      
      // 다음 문장은 현재 자막 지속시간 후 표출
      setTimeout(playNext, sentence.duration + 500);
    };
    
    playNext();
  }
};

// ─── L5 Render: 렌더링 레이어 ───────────────────────────────
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
    HermesState.currentSubtitle = { original, easy, gloss, source };
    
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
    HermesState.onSubtitle?.(original, easy, source);
    HermesState.onGloss?.(gloss, source);
    
    // 일정 시간 후 다음 큐 처리
    if (this.currentTimer) clearTimeout(this.currentTimer);
    const duration = Math.max(3000, original.length * 80);
    
    this.currentTimer = setTimeout(() => {
      this.clearSubtitle();
      HermesState.currentSubtitle = null;
      L4_Route.processQueue();
    }, duration);
  },
  
  clearSubtitle() {
    if (this.subtitleEl) this.subtitleEl.classList.remove('subtitle-active');
    if (this.easyEl) this.easyEl.classList.remove('easy-active');
    if (this.glossEl) this.glossEl.classList.remove('gloss-active');
  }
};

// ─── 웹캠 수화 감지 시뮬레이터 ──────────────────────────────
// (실제 MediaPipe Hands 없을 때 시연용)
const SignDetector = {
  active: false,
  gestureQueue: ['wave', 'open', 'spread', 'peace', 'fist', 'thumbsup', 'point', 'clap'],
  gestureIndex: 0,
  intervalId: null,
  
  start() {
    if (this.active) return;
    this.active = true;
    // 4초마다 새 제스처 감지 (시뮬레이션)
    this.intervalId = setInterval(() => {
      if (this.gestureIndex >= this.gestureQueue.length) {
        this.stop();
        HermesState.onStatus?.('[수화인식] 모든 제스처 표출 완료');
        return;
      }
      const gesture = this.gestureQueue[this.gestureIndex++];
      L2_Decode.processGesture(gesture);
    }, 4500);
  },
  
  stop() {
    this.active = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  },
  
  reset() {
    this.stop();
    this.gestureIndex = 0;
    HermesState.shownGlosses.clear();
  }
};

// ─── 공개 API ────────────────────────────────────────────────
// 전역 객체에 추가
window.HermesState = HermesState;
window.L1_Source = L1_Source;
window.L2_Decode = L2_Decode;
window.L3_Transform = L3_Transform;
window.L4_Route = L4_Route;
window.L5_Render = L5_Render;
window.SignDetector = SignDetector;
