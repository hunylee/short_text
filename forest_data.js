// ============================================================
// Hermes L4 Route Layer: 더불어숲시리즈(2) 문장 데이터베이스
// ============================================================

const FOREST_TEXT = `(1)부활을 달리는 교회  (2)접붙임 받은 교회  (3)사랑으로 숨 쉬는 교회

지난 칼럼(4.5) '부활을 달리는 교회'에서 부활절과 식목일을 함께 바라보며, 한 그루의 나무로 자라고 깊어져 결국 하나님 나라의 울창한 숲을 이루는 3교구 교회로서의 비전을 나누었습니다. 그 비전의 연장선에서 '어떤 나무로 자라갈 것인가?' 물을 때, 결국 뿌리 깊은 나무로 자라가야 함을 깨닫게 됩니다. 뿌리가 깊은 나무는 바람에 흔들리지 않습니다. 그리스도인의 삶도 단번에 완성되는 존재가 아니라, 말씀과 은혜 안에서 날마다 뿌리를 점차 깊이 내려가는 성화의 과정에 있습니다.

그러나 아무리 뿌리가 깊은 나무라 할지라도 홀로 서 있는 나무는 결국 한계에 부딪히게 됩니다. 강한 바람 앞에서 꺾이거나, 긴 시간 속에서 스스로를 지키기 어렵습니다. 교계의 영적 거장들이 바람 앞에 쓰러지는 이유입니다. 반면 숲을 이루는 나무는 다릅니다. 숲 속의 나무들은 서로의 뿌리를 맞대고 연결되어 있어 보이지 않는 곳에서 서로를 붙들어 줍니다. 그래서 늙은 고목나무도, 아직 여린 어린 나무도, 이제 막 가지를 내는 나무도 함께 안전할 수 있습니다. 숲은 이렇게 단순한 집합이 아니라 서로를 살리는 연결입니다.

우리 3교구 교회가 뿌리 깊은 나무 고작 몇 그루가 아닌 '더불어 숲'이 되면 좋겠습니다. 잠실중앙교회라는 울창한 삼림 안에서, 각 사람은 한 그루의 나무로 서 있지만 동시에 함께 자라는 숲입니다. 그 숲 가운데 '사랑, 믿음, 기쁨, 은혜, 온유, 화평, 브릿지 다락방'의 열매를 비롯한 성령의 열매를 맺어가는 숲입니다. 그 열매가 우리 삶 속에 자연스럽게 드러나는 공동체, 서로의 성장을 기뻐하고 함께 열매 맺는 아름다운 하나님 나라 숲입니다.

그런데 반드시 기억해야 할 것이 있습니다. 이 모든 시작이 우리에게 있지 않다는 사실입니다. 우리는 스스로 자라나는 나무가 아니라, 예수님께 접붙임 받은 가지입니다. 그 은혜 안에 머물러 있을 때에만 우리는 생명을 얻고 선한 열매를 맺을 수 있습니다. 그러므로 우리는 예수님께 찰싹 달라붙어 있는 가지로, 주 안에서 함께 지어져 가는 공동체로 세워져 가야 합니다.

그렇게 한 그루의 나무를 넘어 서로 연결된 숲으로 자라나, 선한 열매를 맺는 3교구 교회! 그 비전을 바라보니, 교구 담임으로서 제 발걸음이 설레지 않을 수가 없는 요즘입니다.

3교구 담임 김선민`;

// 문장 단위로 분리
function splitIntoSentences(text) {
  // 마침표, 물음표, 느낌표 기준으로 분리 (단, 숫자 뒤 마침표 제외)
  const raw = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  // 중복 제거
  const seen = new Set();
  return raw.filter(s => {
    const key = s.slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Gloss 변환 규칙 (한국어 수화 어순: 주어-목적어-동사, 조사 제거)
const GLOSS_RULES = {
  // 조사 목록 (제거 대상)
  josa: ['은', '는', '이', '가', '을', '를', '의', '에', '에서', '으로', '로', '와', '과', '도', '만', '까지', '부터', '한테', '께', '이라는', '라는', '이고', '고', '에게', '서'],
  
  // 어미 단순화 (원형으로)
  endings: {
    '합니다': '하다', '됩니다': '되다', '있습니다': '있다', '없습니다': '없다',
    '입니다': '이다', '습니다': '~하다', '겠습니다': '하다', '했습니다': '했다',
    '됩니다': '되다', '줍니다': '주다', '됩니다': '되다', '합니다': '하다',
    '나눴습니다': '나누다', '나누었습니다': '나누다', '깨닫게': '깨닫다',
    '흔들리지': '흔들리다 안', '어렵습니다': '어렵다',
    '좋겠습니다': '좋다', '있지만': '있다', '맺는': '맺다',
    '자라갈': '자라가다', '내려가는': '내려가다', '쓰러지는': '쓰러지다',
    '붙들어': '붙들다', '설레지': '설레다',
  },
  
  // 핵심 단어 매핑 (쉬운 한국어를 Gloss로 매핑)
  keywords: {
    '살아나다': '다시 살다', '교회': '교회', '예수님': '예수님', '연결되다': '연결되다',
    '사랑': '사랑', '나무': '나무', '숲': '숲', '뿌리': '뿌리', '바람': '바람',
    '하나님': '하나님', '생명': '생명', '성령': '성령', '훌륭하다': '훌륭하다',
    '사람': '사람', '함께': '함께', '자라다': '자라다', '열매': '열매'
  }
};

// ─── 쉬운 한국어(Easy Korean) 변환 규칙 ───
// 농인이 직관적으로 이해하기 어려운 은유/추상어/신학용어를 쉬운 표현으로 바꿉니다.
const EASY_KOREAN_RULES = {
  '부활을 달리는': '다시 살아나서 앞으로 나아가는',
  '접붙임 받은': '예수님과 하나로 연결된',
  '사랑으로 숨 쉬는': '사랑으로 가득한',
  '단번에 완성되는 존재가 아니라': '한 번에 끝나는 것이 아니라',
  '성화의 과정에 있습니다': '점점 거룩해지는 과정에 있습니다',
  '한계에 부딪히게 됩니다': '결국 무너집니다',
  '영적 거장들이': '믿음이 훌륭한 사람들도',
  '고작 몇 그루가 아닌': '단순히 몇 그루가 아닌',
  '찰싹 달라붙어 있는 가지로': '단단히 연결된 가지로',
  '지어져 가는 공동체로': '만들어지는 공동체로',
  '제 발걸음이 설레지 않을 수가 없는 요즘입니다': '저는 요즘 매우 설레고 기쁩니다'
};

// 원문 → 쉬운 한국어 변환 함수
function toEasyKorean(sentence) {
  let easy = sentence;
  // 미리 정의된 규칙으로 치환
  for (const [hard, simple] of Object.entries(EASY_KOREAN_RULES)) {
    easy = easy.replace(new RegExp(hard, 'g'), simple);
  }
  return easy;
}

// 문장 → Gloss 변환 함수
function textToGloss(sentence) {
  let gloss = sentence;
  
  // 괄호 내용 제거
  gloss = gloss.replace(/\([^)]*\)/g, '');
  
  // 어미 단순화
  for (const [ending, base] of Object.entries(GLOSS_RULES.endings)) {
    gloss = gloss.replace(new RegExp(ending, 'g'), base);
  }
  
  // 구두점 제거
  gloss = gloss.replace(/[.,!?;:'"·]/g, '');
  
  // 불필요한 연결어 제거
  const removeWords = ['그런데', '그러나', '그래서', '그렇게', '반면', '결국', '아무리', '동시에', '이렇게', '단번에', '점차', '함께', '서로'];
  removeWords.forEach(w => {
    gloss = gloss.replace(new RegExp(w + '\\s*', 'g'), '');
  });
  
  // 조사 제거 (단어 뒤 조사)
  GLOSS_RULES.josa.forEach(j => {
    gloss = gloss.replace(new RegExp('(?<=\\S)' + j + '(?=\\s|$)', 'g'), '');
  });
  
  // 공백 정리
  gloss = gloss.replace(/\s+/g, ' ').trim();
  
  // 핵심 단어만 추출 (최대 8개)
  const words = gloss.split(' ').filter(w => w.length > 1);
  const unique = [...new Set(words)];
  
  return unique.slice(0, 8).join(' ');
}

// 모든 문장 + Easy + Gloss 데이터셋 생성
const FOREST_SENTENCES = splitIntoSentences(FOREST_TEXT).map((sentence, idx) => {
  const easy = toEasyKorean(sentence);
  return {
    id: idx,
    original: sentence,
    easy: easy,
    gloss: textToGloss(easy), // 쉬운 문장 기준으로 Gloss 생성
    duration: Math.max(3000, sentence.length * 80), // 표출 시간 (ms)
  };
});

// 수화 영상 샘플 연동 데이터 (1.mp4 × 2)
const SIGN_VIDEO_SAMPLES = [
  {
    id: 'sign_1',
    label: '수화 영상 샘플 1',
    filename: '1.mp4',
    // 영상 내 수화 동작 → 예상 문장 (실제 인식 시 교체)
    mockSentences: [
      { time: 0,   original: '우리는 함께 자라는 숲입니다.', easy: '우리는 함께 자라는 숲입니다.', gloss: '우리 자라다 숲' },
      { time: 4,   original: '뿌리가 깊은 나무는 바람에 흔들리지 않습니다.', easy: '뿌리가 깊은 나무는 바람에 흔들리지 않습니다.', gloss: '뿌리 깊다 나무 바람 흔들리다 안' },
      { time: 8,   original: '서로를 살리는 연결입니다.', easy: '서로를 살리는 연결입니다.', gloss: '서로 살리다 연결' },
      { time: 12,  original: '사랑으로 숨 쉬는 교회입니다.', easy: '사랑으로 가득한 교회입니다.', gloss: '사랑 가득하다 교회' },
    ]
  },
  {
    id: 'sign_2',
    label: '수화 영상 샘플 2',
    filename: '1.mp4', // 같은 파일을 두 번째 샘플로 오프셋 사용
    timeOffset: 16,
    mockSentences: [
      { time: 0,   original: '예수님께 접붙임 받은 가지입니다.', easy: '예수님과 하나로 연결된 가지입니다.', gloss: '예수님 하나 연결되다 가지' },
      { time: 4,   original: '선한 열매를 맺는 3교구 교회!', easy: '좋은 열매를 맺는 3교구 교회!', gloss: '좋다 열매 맺다 3교구 교회' },
      { time: 8,   original: '그 은혜 안에 머물러 있을 때 생명을 얻습니다.', easy: '그 은혜 안에 있을 때 생명을 얻습니다.', gloss: '은혜 있다 생명 얻다' },
      { time: 12,  original: '더불어 숲이 되면 좋겠습니다.', easy: '함께 숲이 되면 좋겠습니다.', gloss: '함께 숲 되다' },
    ]
  }
];

// 웹캠 수화 인식 제스처 → 문장 매핑 (MediaPipe 연동용)
const GESTURE_TO_GLOSS = {
  'wave':     { original: '안녕하세요', easy: '안녕하세요', gloss: '안녕' },
  'thumbsup': { original: '좋습니다 / 잘했어요', easy: '좋습니다', gloss: '좋다 잘하다' },
  'open':     { original: '함께 나눕니다', easy: '함께 나눕니다', gloss: '함께 나누다' },
  'point':    { original: '이것입니다 / 여기입니다', easy: '여기입니다', gloss: '이것 여기' },
  'fist':     { original: '힘을 냅시다 / 화이팅', easy: '힘을 냅시다', gloss: '힘 내다' },
  'peace':    { original: '사랑합니다 / 평화롭습니다', easy: '사랑합니다', gloss: '사랑 평화' },
  'spread':   { original: '숲을 이루는 나무들', easy: '숲을 만드는 나무들', gloss: '숲 나무 만들다' },
  'clap':     { original: '감사합니다', easy: '감사합니다', gloss: '감사' },
};

// 전역 객체에 추가
window.FOREST_TEXT = FOREST_TEXT;
window.FOREST_SENTENCES = FOREST_SENTENCES;
window.SIGN_VIDEO_SAMPLES = SIGN_VIDEO_SAMPLES;
window.GESTURE_TO_GLOSS = GESTURE_TO_GLOSS;
window.textToGloss = textToGloss;
window.toEasyKorean = toEasyKorean;
window.splitIntoSentences = splitIntoSentences;
