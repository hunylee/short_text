// ============================================================
// Harness App: DOM 이벤트 연결 및 UI 제어 로직
// ============================================================

// ─── UI 요소 ────────────────────────────────────────────────
const UI = {
  // 뱃지 및 파이프라인
  badges: {
    l1: document.getElementById('badge-l1'),
    l2: document.getElementById('badge-l2'),
    l3: document.getElementById('badge-l3'),
    l4: document.getElementById('badge-l4'),
    l5: document.getElementById('badge-l5'),
  },
  pipes: {
    l1: document.getElementById('pipe-l1'),
    l2: document.getElementById('pipe-l2'),
    l3: document.getElementById('pipe-l3'),
    l4: document.getElementById('pipe-l4'),
    l5: document.getElementById('pipe-l5'),
  },
  
  // 모드 버튼
  btnSpeech: document.getElementById('mode-speech'),
  btnText: document.getElementById('mode-text'),
  btnForest: document.getElementById('mode-forest'),
  btnWebcam: document.getElementById('mode-webcam'),
  
  // 상태 로그
  statusLog: document.getElementById('status-log'),
  toast: document.getElementById('system-toast'),
  
  // 자막 출력 보드
  displayBoard: document.getElementById('main-subtitle-display'),
  boardOriginal: document.getElementById('board-original'),
  boardEasy: document.getElementById('board-easy'),
  boardGloss: document.getElementById('board-gloss'),
  boardSource: document.getElementById('board-source'),
  
  // 비디오 오버레이
  videoSubtitle: document.getElementById('video-subtitle'),
  videoEasy: document.getElementById('video-easy'),
  videoGloss: document.getElementById('video-gloss'),
  videoBadge: document.getElementById('video-source-badge'),
  
  // 입력 영역들
  mainVideo: document.getElementById('main-video'),
  videoPlaceholder: document.getElementById('video-placeholder'),
  webcamWrapper: document.getElementById('webcam-wrapper'),
  webcamVideo: document.getElementById('webcam-video'),
  webcamOverlay: document.getElementById('webcam-overlay'),
  textInputWrapper: document.getElementById('text-input-wrapper'),
  textInputField: document.getElementById('text-input-field'),
  btnTextSubmit: document.getElementById('btn-text-submit'),
  
  // 리스트 영역
  forestList: document.getElementById('forest-list-container'),
  signTabs: document.getElementById('sign-tabs'),

  // AI Agent 설정 UI
  aiToggle: document.getElementById('ai-toggle'),
  aiApikey: document.getElementById('ai-apikey'),
  btnToggleApikey: document.getElementById('btn-toggle-apikey'),
  aiDomain: document.getElementById('ai-domain'),
  aiExclusions: document.getElementById('ai-exclusions'),
  aiDepth: document.getElementById('ai-depth'),
  aiDepthVal: document.getElementById('ai-depth-val'),
  aiActiveIndicator: document.getElementById('ai-active-indicator'),
};

let activeLayerTimers = {};

// ─── 유틸리티 함수 ──────────────────────────────────────────
function showToast(msg) {
  UI.toast.textContent = msg;
  UI.toast.classList.add('show');
  setTimeout(() => UI.toast.classList.remove('show'), 3000);
}

function appendLog(msg, isNew = true) {
  const line = document.createElement('span');
  line.className = 'status-line' + (isNew ? ' new' : '');
  const time = new Date().toLocaleTimeString('en-GB');
  line.textContent = `[${time}] ${msg}`;
  UI.statusLog.appendChild(line);
  UI.statusLog.scrollTop = UI.statusLog.scrollHeight;
}

function activateLayer(layerNum) {
  const badge = UI.badges[`l${layerNum}`];
  const pipe = UI.pipes[`l${layerNum}`];
  
  if (badge) badge.classList.add('active');
  if (pipe) pipe.classList.add('active');
  
  if (activeLayerTimers[layerNum]) clearTimeout(activeLayerTimers[layerNum]);
  
  activeLayerTimers[layerNum] = setTimeout(() => {
    if (badge) badge.classList.remove('active');
    if (pipe) pipe.classList.remove('active');
  }, 1500);
}

function setMode(mode) {
  window.HermesState.mode = mode;
  
  // 버튼 상태 초기화
  [UI.btnSpeech, UI.btnText, UI.btnForest, UI.btnWebcam].forEach(btn => btn.classList.remove('active'));
  
  // 입력 영역 초기화
  UI.videoPlaceholder.style.display = 'flex';
  UI.mainVideo.style.display = 'none';
  UI.mainVideo.pause();
  UI.webcamWrapper.style.display = 'none';
  UI.textInputWrapper.style.display = 'none';
  UI.signTabs.style.display = 'flex';
  
  window.L1_Source.stopSpeech();
  window.L1_Source.stopWebcam();
  window.SignDetector.stop();
  
  switch (mode) {
    case 'speech':
      UI.btnSpeech.classList.add('active');
      const ok = window.L1_Source.startSpeech();
      if (ok) {
        showToast('음성 인식을 시작합니다. 말씀해주세요.');
        appendLog('음성 인식 마이크 활성화됨');
      } else {
        showToast('음성 인식을 지원하지 않는 브라우저입니다.');
        appendLog('Web Speech API 지원 안함', false);
      }
      break;
      
    case 'text':
      UI.btnText.classList.add('active');
      UI.textInputWrapper.style.display = 'block';
      UI.textInputField.focus();
      showToast('텍스트 입력 모드입니다.');
      break;
      
    case 'forest':
      UI.btnForest.classList.add('active');
      showToast('더불어숲 텍스트 자동 재생을 시작합니다.');
      appendLog('더불어숲시리즈 재생 모드 시작');
      window.L4_Route.playForestSentences(0);
      break;
      
    case 'webcam':
      UI.btnWebcam.classList.add('active');
      UI.videoPlaceholder.style.display = 'none';
      UI.mainVideo.style.display = 'none';
      UI.webcamWrapper.style.display = 'block';
      UI.webcamOverlay.style.display = 'flex';
      UI.signTabs.style.display = 'none';
      
      window.L1_Source.startWebcam(UI.webcamVideo).then(success => {
        if (success) {
          showToast('웹캠 활성화 완료. 수화 인식을 시뮬레이션합니다.');
          appendLog('웹캠 연결 완료');
          window.SignDetector.reset();
          window.SignDetector.start();
        }
      });
      break;
      
    case 'video':
      // 비디오 모드는 탭 클릭 시 활성화
      UI.videoPlaceholder.style.display = 'none';
      UI.mainVideo.style.display = 'block';
      break;
  }
}

// ─── UI 렌더링 (목록 및 탭) ──────────────────────────────
function renderForestList() {
  UI.forestList.innerHTML = '';
  window.FOREST_SENTENCES.forEach(s => {
    const item = document.createElement('div');
    item.className = 'forest-item';
    item.id = `forest-item-${s.id}`;
    
    item.innerHTML = `
      <div class="forest-item-num">${s.id + 1}</div>
      <div class="forest-item-text">
        ${s.original}
        <span class="forest-item-gloss">${s.gloss}</span>
      </div>
    `;
    
    item.onclick = () => {
      activateLayer(1);
      window.L2_Decode.processText(s.original, 'forest');
    };
    
    UI.forestList.appendChild(item);
  });
}

function renderSignTabs() {
  UI.signTabs.innerHTML = '';
  window.SIGN_VIDEO_SAMPLES.forEach((sample, idx) => {
    const tab = document.createElement('div');
    tab.className = 'sign-tab';
    if (idx === 0) tab.classList.add('active');
    // 짧은 레이블: "1 교회", "2 교회", "3 숲" 등
    const shortLabel = sample.label.replace(/수화 영상 샘플 /, '');
    tab.textContent = shortLabel;
    
    tab.onclick = () => {
      // 비디오 로드 및 재생
      setMode('video');
      // 중복 방지 글로스 초기화 (새 영상 선택 시)
      window.HermesState.shownGlosses.clear();
      document.querySelectorAll('.sign-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 더미 파일로 테스트
      UI.mainVideo.src = `https://www.w3schools.com/html/mov_bbb.mp4`; // 플레이스홀더 영상
      UI.mainVideo.dataset.videoId = sample.id;
      
      UI.mainVideo.play().catch(e => {
        appendLog(`비디오 재생 실패: ${e.message}`, false);
        showToast('샘플 영상을 찾을 수 없습니다. 시뮬레이션으로 대체합니다.');
        // 시뮬레이션 모드 가동
        simulateVideoTimecode(sample.id);
      });
      
      appendLog(`수화 영상 로드: ${sample.label}`);
    };
    
    UI.signTabs.appendChild(tab);
  });
}

// 비디오가 없을 경우 시간만 시뮬레이션
function simulateVideoTimecode(videoId) {
  let time = 0;
  const interval = setInterval(() => {
    if (window.HermesState.mode !== 'video') {
      clearInterval(interval); return;
    }
    window.L2_Decode.processVideoTimecode(videoId, time);
    time += 1; // 1초씩 증가
    if (time > 20) clearInterval(interval);
  }, 1000);
}

// ─── 헤르메스 이벤트 연결 ──────────────────────────────────
window.HermesState.onStatus = (msg) => {
  appendLog(msg);
  // 메시지 내용에 따라 레이어 활성화 시각화
  if (msg.includes('[L1]')) activateLayer(1);
  if (msg.includes('[L2]')) activateLayer(2);
  if (msg.includes('[L3]')) activateLayer(3);
  if (msg.includes('[L4]')) activateLayer(4);
};

window.HermesState.onSubtitle = (original, easy, source) => {
  activateLayer(5); // L5 Render
  
  // Board 업데이트
  UI.displayBoard.classList.remove('active');
  void UI.displayBoard.offsetWidth; // reflow
  UI.displayBoard.classList.add('active');
  
  UI.boardOriginal.textContent = original;
  UI.boardEasy.textContent = easy || original;
  
  // Forest List 시각화 업데이트
  if (source === 'forest') {
    const sentence = window.FOREST_SENTENCES.find(s => s.original === original);
    if (sentence) {
      const item = document.getElementById(`forest-item-${sentence.id}`);
      if (item) {
        item.classList.add('shown');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
};

window.HermesState.onGloss = (gloss, source) => {
  UI.boardGloss.textContent = gloss;
  
  const sourceLabels = {
    forest: '📖 더불어숲 추출',
    speech: '🎤 음성 인식 (STT)',
    video: '🤟 수화 영상 번역',
    gesture: '📷 웹캠 제스처',
    text: '✏️ 직접 입력'
  };
  UI.boardSource.textContent = sourceLabels[source] || source;
  
  // 비디오 오버레이가 활성화된 모드면 같이 업데이트
  if (window.HermesState.mode === 'video' || window.HermesState.mode === 'webcam') {
    UI.videoBadge.textContent = sourceLabels[source] || source;
    UI.videoBadge.classList.add('badge-active');
    // 오버레이 애니메이션 리셋
    UI.videoSubtitle.classList.remove('subtitle-active');
    UI.videoEasy.classList.remove('easy-active');
    UI.videoGloss.classList.remove('gloss-active');
    void UI.videoSubtitle.offsetWidth;
    
    UI.videoSubtitle.textContent = UI.boardOriginal.textContent;
    UI.videoEasy.textContent = UI.boardEasy.textContent;
    UI.videoGloss.textContent = gloss;
    
    UI.videoSubtitle.classList.add('subtitle-active');
    if (UI.videoEasy.textContent) UI.videoEasy.classList.add('easy-active');
    UI.videoGloss.classList.add('gloss-active');
    
    setTimeout(() => {
      UI.videoBadge.classList.remove('badge-active');
      UI.videoSubtitle.classList.remove('subtitle-active');
      UI.videoEasy.classList.remove('easy-active');
      UI.videoGloss.classList.remove('gloss-active');
    }, 4000);
  }
};

// ─── 이벤트 리스너 설정 ─────────────────────────────────────
UI.btnSpeech.addEventListener('click', () => setMode('speech'));
UI.btnText.addEventListener('click', () => setMode('text'));
UI.btnForest.addEventListener('click', () => setMode('forest'));
UI.btnWebcam.addEventListener('click', () => setMode('webcam'));

UI.btnTextSubmit.addEventListener('click', () => {
  const text = UI.textInputField.value.trim();
  if (text) {
    activateLayer(1);
    window.L2_Decode.processText(text, 'text');
    UI.textInputField.value = '';
  }
});
UI.textInputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') UI.btnTextSubmit.click();
});

document.getElementById('btn-demo-video').addEventListener('click', () => {
  const firstTab = UI.signTabs.querySelector('.sign-tab');
  if (firstTab) firstTab.click();
});

// 비디오 시간 업데이트 이벤트
UI.mainVideo.addEventListener('timeupdate', () => {
  if (window.HermesState.mode === 'video' && UI.mainVideo.dataset.videoId) {
    window.L2_Decode.processVideoTimecode(UI.mainVideo.dataset.videoId, UI.mainVideo.currentTime);
  }
});

// ─── AI Agent 설정 관리 ─────────────────────────────────────
function initAIAgentConfig() {
  const state = window.HermesState;

  // 1. LocalStorage에서 저장된 값 로드
  const savedEnabled = localStorage.getItem('hermes_ai_enabled') === 'true';
  const savedApiKey = localStorage.getItem('hermes_ai_apikey') || '';
  const savedDomain = localStorage.getItem('hermes_ai_domain') || 'church';
  const savedExclusions = localStorage.getItem('hermes_ai_exclusions') || '';
  const savedDepth = parseInt(localStorage.getItem('hermes_ai_depth') || '5', 10);

  // 2. State 반영
  state.aiEnabled = savedEnabled;
  state.apiKey = savedApiKey;
  state.domain = savedDomain;
  state.exclusions = savedExclusions;
  state.contextDepth = savedDepth;

  // 3. UI 동기화
  if (UI.aiToggle) UI.aiToggle.checked = savedEnabled;
  if (UI.aiApikey) UI.aiApikey.value = savedApiKey;
  if (UI.aiDomain) UI.aiDomain.value = savedDomain;
  if (UI.aiExclusions) UI.aiExclusions.value = savedExclusions;
  if (UI.aiDepth) {
    UI.aiDepth.value = savedDepth;
    if (UI.aiDepthVal) UI.aiDepthVal.textContent = savedDepth;
  }
  
  updateAIIndicator();

  // 4. 이벤트 핸들러 등록
  
  // AI 활성화 토글 변경
  UI.aiToggle?.addEventListener('change', (e) => {
    state.aiEnabled = e.target.checked;
    localStorage.setItem('hermes_ai_enabled', state.aiEnabled);
    updateAIIndicator();
    appendLog(`AI 에이전트 ${state.aiEnabled ? '활성화됨' : '비활성화됨'}`);
    showToast(`AI 에이전트가 ${state.aiEnabled ? '켜졌습니다' : '꺼졌습니다'}.`);
  });

  // API Key 변경
  UI.aiApikey?.addEventListener('input', (e) => {
    state.apiKey = e.target.value.trim();
    localStorage.setItem('hermes_ai_apikey', state.apiKey);
  });

  // 비밀번호 보이기/숨기기 토글
  UI.btnToggleApikey?.addEventListener('click', () => {
    if (UI.aiApikey.type === 'password') {
      UI.aiApikey.type = 'text';
      UI.btnToggleApikey.textContent = '🔒';
    } else {
      UI.aiApikey.type = 'password';
      UI.btnToggleApikey.textContent = '👁️';
    }
  });

  // 도메인 변경
  UI.aiDomain?.addEventListener('change', (e) => {
    state.domain = e.target.value;
    localStorage.setItem('hermes_ai_domain', state.domain);
    appendLog(`상황 도메인 설정 변경: ${state.domain}`);
  });

  // 제외 단어 변경
  UI.aiExclusions?.addEventListener('input', (e) => {
    state.exclusions = e.target.value;
    localStorage.setItem('hermes_ai_exclusions', state.exclusions);
  });

  // 컨텍스트 깊이 슬라이더 변경
  UI.aiDepth?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.contextDepth = val;
    if (UI.aiDepthVal) UI.aiDepthVal.textContent = val;
    localStorage.setItem('hermes_ai_depth', val);
    
    // 현재 버퍼 크기가 깊이보다 크면 정리
    while (state.recentSentences.length > val) {
      state.recentSentences.shift();
    }
  });
}

function updateAIIndicator() {
  const state = window.HermesState;
  if (state.aiEnabled) {
    UI.aiActiveIndicator?.classList.add('active');
  } else {
    UI.aiActiveIndicator?.classList.remove('active');
  }
}

// ─── 초기화 ────────────────────────────────────────────────
window.onload = () => {
  renderForestList();
  renderSignTabs();
  initAIAgentConfig();
  
  // L5 Render 엔진에 UI 연결
  window.L5_Render.init(null, null, null, null); // 직접 이벤트 구독 방식 사용
  
  appendLog('시스템 준비 완료');
};
