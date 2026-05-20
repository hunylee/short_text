// ============================================================
// Hermes L3 Transform: Gloss 변환 레이어
// ============================================================

const L3_Transform = {
  async transformToGloss(text, source) {
    const state = window.HermesState;
    
    // 1. AI 활성화 및 API 키 입력 여부 확인 후 Gemini API 호출
    if (state.aiEnabled && state.apiKey) {
      const displayBoard = document.getElementById('main-subtitle-display');
      const configCard = document.querySelector('.ai-config-card');
      
      try {
        if (displayBoard) displayBoard.classList.add('ai-processing');
        if (configCard) configCard.classList.add('ai-processing');
        
        state.onStatus?.(`[L3] [AI Agent] Gemini API 호출 중: "${text}"`);
        
        const result = await this.callGeminiAPI(text, state);
        
        let easy = result.easy || text;
        let gloss = result.gloss || text;
        
        // 제외 단어 강제 필터링 (안정장치)
        if (state.exclusions) {
          const exclList = state.exclusions.split(',').map(w => w.trim()).filter(w => w.length > 0);
          exclList.forEach(word => {
            const regex = new RegExp(word, 'gi');
            easy = easy.replace(regex, '');
            gloss = gloss.replace(regex, '');
          });
          easy = easy.replace(/\s+/g, ' ').trim();
          gloss = gloss.replace(/\s+/g, ' ').trim();
        }
        
        // 중복 Gloss 필터링
        if (state.shownGlosses.has(gloss)) {
          state.onStatus?.(`[L3] [AI Agent] 중복 Gloss 건너뜀: "${gloss}"`);
          return;
        }
        
        state.onStatus?.(`[L3] [AI Agent] 변환 성공 (상황: ${state.domain})`);
        state.onStatus?.(`[L3] [AI Agent] Easy: "${easy}"`);
        state.onStatus?.(`[L3] [AI Agent] Gloss: "${gloss}"`);
        
        // 컨텍스트 업데이트
        this.updateRecentSentences(text, easy, gloss, state);
        
        window.L4_Route.routeGloss(text, easy, gloss, source);
        return;
        
      } catch (error) {
        state.onStatus?.(`[L3] [AI Agent] 오류 발생, 룰 기반 대체 사용: ${error.message}`);
      } finally {
        if (displayBoard) displayBoard.classList.remove('ai-processing');
        if (configCard) configCard.classList.remove('ai-processing');
      }
    }
    
    // 2. AI 비활성화 또는 API 에러 시 룰 기반 Fallback 작동
    let easy = window.toEasyKorean ? window.toEasyKorean(text) : text;
    let gloss = window.textToGloss(easy);
    
    // 룰 기반 제외 단어 필터링
    if (state.exclusions) {
      const exclList = state.exclusions.split(',').map(w => w.trim()).filter(w => w.length > 0);
      exclList.forEach(word => {
        const regex = new RegExp(word, 'gi');
        gloss = gloss.replace(regex, '');
      });
      gloss = gloss.replace(/\s+/g, ' ').trim();
    }
    
    if (state.shownGlosses.has(gloss)) {
      state.onStatus?.(`[L3] 중복 Gloss 건너뜀: "${gloss}"`);
      return;
    }
    
    state.onStatus?.(`[L3] Easy 변환: "${text}" → "${easy}"`);
    state.onStatus?.(`[L3] Gloss 변환: "${easy}" → "${gloss}"`);
    
    // 컨텍스트 업데이트
    this.updateRecentSentences(text, easy, gloss, state);
    
    window.L4_Route.routeGloss(text, easy, gloss, source);
  },
  
  // ─── 수화 영상 Whisper + Gloss 통합 변환 ─────────────────
  async transformVideoEntry(whisper, signGloss, fallbackEasy, source) {
    const state = window.HermesState;
    
    // AI 활성화 및 API 키 확인 → Gemini API 호출
    if (state.aiEnabled && state.apiKey) {
      const displayBoard = document.getElementById('main-subtitle-display');
      const configCard = document.querySelector('.ai-config-card');
      
      try {
        if (displayBoard) displayBoard.classList.add('ai-processing');
        if (configCard) configCard.classList.add('ai-processing');
        
        state.onStatus?.(`[L3] [AI Agent] Whisper+Gloss 통합 변환 중...`);
        
        const result = await this.callGeminiVideoAPI(whisper, signGloss, state);
        
        let easy = result.easy || fallbackEasy;
        let gloss = result.gloss || signGloss;
        
        // 제외 단어 강제 필터링
        if (state.exclusions) {
          const exclList = state.exclusions.split(',').map(w => w.trim()).filter(w => w.length > 0);
          exclList.forEach(word => {
            const regex = new RegExp(word, 'gi');
            easy = easy.replace(regex, '');
            gloss = gloss.replace(regex, '');
          });
          easy = easy.replace(/\s+/g, ' ').trim();
          gloss = gloss.replace(/\s+/g, ' ').trim();
        }
        
        state.onStatus?.(`[L3] [AI Agent] 청각장애인 요약: "${easy}"`);
        state.onStatus?.(`[L3] [AI Agent] Sign Gloss: "${gloss}"`);
        
        this.updateRecentSentences(whisper, easy, gloss, state);
        window.L4_Route.routeGloss(whisper, easy, gloss, source);
        return;
        
      } catch (error) {
        state.onStatus?.(`[L3] [AI Agent] 영상 변환 오류, Fallback 사용: ${error.message}`);
      } finally {
        if (displayBoard) displayBoard.classList.remove('ai-processing');
        if (configCard) configCard.classList.remove('ai-processing');
      }
    }
    
    // Fallback: 사전 정의된 easy/gloss 사용
    state.onStatus?.(`[L3] Fallback 사용 → Easy: "${fallbackEasy}"`);
    state.onStatus?.(`[L3] Fallback 사용 → Gloss: "${signGloss}"`);
    this.updateRecentSentences(whisper, fallbackEasy, signGloss, state);
    window.L4_Route.routeGloss(whisper, fallbackEasy, signGloss, source);
  },
  
  // Gemini API: Whisper+Gloss 통합 변환 프롬프트
  async callGeminiVideoAPI(whisper, signGloss, state) {
    const domainMap = {
      general: '일반 (General)',
      church: '교회 (Church)',
      hospital: '병원 (Hospital)',
      public_office: '공공기관 (Public Office)'
    };
    
    const domainName = domainMap[state.domain] || state.domain;
    const exclusionsText = state.exclusions ? state.exclusions : '없음';
    
    const systemInstruction = `너는 한국수어(KSL) 전문 통역사이자 청각장애인을 위한 쉬운 한국어 변환 전문가이다.
아래 두 가지 입력이 주어진다:
1. Whisper STT (음성 인식 텍스트): 수화 영상의 음성을 텍스트로 변환한 결과
2. Sign Gloss (수어 글로스): 수화 동작을 핵심 단어로 나열한 것

이 두 가지를 종합하여, 다음 JSON 객체를 반환하라:
{
  "easy": "청각장애인이 직관적으로 이해할 수 있는 쉬운 한국어 문장 (비유·은유·한자어 제거, 짧고 명확하게)",
  "gloss": "한국수어 어순(SOV)으로 재배열된 핵심 단어 나열 (조사 제거, 동사 기본형, 공백 구분, 최대 8개)"
}

규칙:
1. Whisper STT와 Sign Gloss의 의미를 교차 검증하여 가장 정확한 번역을 생성하라.
2. 제외 단어가 있으면 절대 결과에 포함하지 마라.
3. 이전 컨텍스트가 있으면 문맥 연속성을 유지하라.
4. JSON 형식만 반환하라. 마크다운 블록이나 부가 설명은 포함하지 마라.`;

    const prompt = `상황 도메인: ${domainName}
제외할 단어: ${exclusionsText}
이전 컨텍스트: ${JSON.stringify(state.recentSentences.slice(-3))}

[Whisper STT]: "${whisper}"
[Sign Gloss]: "${signGloss}"`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
    
    const payload = {
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }
      ],
      generationConfig: { responseMimeType: "application/json" }
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (HTTP ${response.status}): ${errText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API 응답이 비어 있습니다.');
      }
      
      const responseText = data.candidates[0].content.parts[0].text.trim();
      const result = JSON.parse(responseText);
      
      if (!result.easy || !result.gloss) {
        throw new Error('JSON 응답에 easy 또는 gloss 키가 누락되었습니다.');
      }
      
      return result;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  },
  
  // 최근 문장 버퍼 관리
  updateRecentSentences(original, easy, gloss, state) {
    state.recentSentences.push({ original, easy, gloss });
    if (state.recentSentences.length > state.contextDepth) {
      state.recentSentences.shift();
    }
  },
  
  // Gemini API 실호출 메서드
  async callGeminiAPI(text, state) {
    const domainMap = {
      general: '일반 (General)',
      church: '교회 (Church)',
      hospital: '병원 (Hospital)',
      public_office: '공공기관 (Public Office)'
    };
    
    const domainName = domainMap[state.domain] || state.domain;
    const exclusionsText = state.exclusions ? state.exclusions : '없음';
    
    const prompt = `
상황 도메인(Context Domain): ${domainName}
제외할 단어(Do NOT output these words): ${exclusionsText}
이전 문장 컨텍스트(Previous context history): ${JSON.stringify(state.recentSentences)}

다음 문장을 번역하세요:
"${text}"
`;

    const systemInstruction = `너는 한국수어(KSL) 번역가 및 쉬운 한국어 요약가이다.
입력 한국어 문장을 다음 두 가지로 변환하여 JSON 객체로 반환하라. 반드시 다음 JSON 구조와 일치해야 하며 다른 텍스트는 포함하지 말라.

{
  "easy": "어려운 표현이나 은유, 한자어를 농인이 직관적으로 이해하기 쉽게 교정된 한국어 문장 (상황 도메인 고려)",
  "gloss": "쉬운 한국어 문장을 바탕으로 한국어 수어 어순(일반적으로 주어-목적어-동사)으로 핵심 단어들을 나열한 것 (조사는 제거하고, 동사는 기본형으로 변환, 공백으로 단어 구분, 최대 8개 단어)"
}

규칙:
1. 제외할 단어가 지정되었다면 "easy" 및 "gloss" 결과물에 해당 단어 및 그 유사어가 절대 포함되지 않도록 다른 표현을 사용하라.
2. 이전 문장 컨텍스트가 존재한다면 대화/지문의 문맥이 이어지도록 번역 톤을 유지하라.
3. JSON 형식 외에 마크다운 블록(예: \`\`\`json) 등 어떤 부가 설명도 출력하지 말고 순수 JSON만 반환하라.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
    
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (HTTP ${response.status}): ${errText}`);
      }
      
      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API 응답 결과가 없습니다.');
      }
      
      const responseText = data.candidates[0].content.parts[0].text.trim();
      const result = JSON.parse(responseText);
      
      if (!result.easy || !result.gloss) {
        throw new Error('JSON 응답에 easy 또는 gloss 키가 누락되었습니다.');
      }
      
      return result;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }
};

window.L3_Transform = L3_Transform;
