// ============================================================
// Hermes L1 Source: 입력 소스 관리
// ============================================================

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
          if (text) window.L2_Decode.processText(text, 'speech');
        }
      }
    };
    
    this.recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        window.HermesState.onStatus?.(`음성인식 오류: ${e.error}`);
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
      window.HermesState.onStatus?.('카메라 접근 실패: ' + e.message);
      return false;
    }
  },
  
  stopWebcam() {
    this.webcamStream?.getTracks().forEach(t => t.stop());
    this.webcamStream = null;
  }
};

// 웹캠 수화 감지 시뮬레이터 (실제 MediaPipe Hands 없을 때 시연용)
const SignDetector = {
  active: false,
  gestureQueue: ['wave', 'open', 'spread', 'peace', 'fist', 'thumbsup', 'point', 'clap'],
  gestureIndex: 0,
  intervalId: null,
  
  start() {
    if (this.active) return;
    this.active = true;
    this.intervalId = setInterval(() => {
      if (this.gestureIndex >= this.gestureQueue.length) {
        this.stop();
        window.HermesState.onStatus?.('[수화인식] 모든 제스처 표출 완료');
        return;
      }
      const gesture = this.gestureQueue[this.gestureIndex++];
      window.L2_Decode.processGesture(gesture);
    }, 4500);
  },
  
  stop() {
    this.active = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  },
  
  reset() {
    this.stop();
    this.gestureIndex = 0;
    window.HermesState.shownGlosses.clear();
  }
};

window.L1_Source = L1_Source;
window.SignDetector = SignDetector;
