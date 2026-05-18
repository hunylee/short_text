import cv2
import mediapipe as mp
import numpy as np
import os
from PIL import ImageFont, ImageDraw, Image

# --- 모델 관련 설정 (실제 모델 연동 시 주석 해제하여 사용) ---
# from tensorflow.keras.models import load_model
# model = load_model('sign_model.h5')
# actions = np.array(['병원', '학교', '감사합니다']) # 모델이 분류할 수 있는 수어 단어들
# sequence_length = 30 # 모델이 입력받는 프레임 수

mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    """Mediapipe 랜드마크에서 키포인트를 추출하여 1D Numpy 배열로 반환"""
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    face = np.array([[res.x, res.y, res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, face, lh, rh])

def put_korean_text(image, text, position, font_size, color):
    """OpenCV 화면에 한국어를 출력하기 위한 헬퍼 함수"""
    img_pil = Image.fromarray(image)
    draw = ImageDraw.Draw(img_pil)
    try:
        font = ImageFont.truetype("malgun.ttf", font_size) # 윈도우 기본 맑은고딕
    except IOError:
        font = ImageFont.load_default()
    b, g, r = color
    draw.text(position, text, font=font, fill=(b, g, r, 0))
    return np.array(img_pil)

cap = cv2.VideoCapture(0)

# 실시간 인식을 위한 시퀀스 버퍼
sequence = []
threshold = 0.7 # 예측을 인정할 최소 확률

# 자막(Gloss) 매칭을 위한 타겟 변수
# 실제 연동 시에는 Flask/WebSocket 등을 통해 영상의 현재 자막 Gloss를 실시간으로 받아오도록 연동해야 합니다.
current_target_gloss = "감사합니다" 
predicted_action = "대기중"
confidence = 0.0
is_matched = False

print("카메라를 켜고 수어 인식을 시작합니다. (종료: Q 키)")

with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = holistic.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # 랜드마크 그리기
        mp_drawing.draw_landmarks(image, results.face_landmarks, mp_holistic.FACEMESH_CONTOURS)
        mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
        mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
        mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

        # 1. 키포인트 추출 및 프레임 누적
        keypoints = extract_keypoints(results)
        sequence.append(keypoints)
        sequence = sequence[-30:] # 최근 30프레임 (sequence_length) 유지

        # 2. 30프레임이 모였을 때 예측 수행
        if len(sequence) == 30:
            # --- [실제 모델 예측 로직 (모델 연동 시 활성화)] ---
            # res = model.predict(np.expand_dims(sequence, axis=0))[0]
            # predicted_action = actions[np.argmax(res)]
            # confidence = res[np.argmax(res)]
            
            # --- [테스트용 더미 예측 로직 (실제 모델 학습 전 테스트용)] ---
            # 양손 중 하나라도 인식되면 '감사합니다'를 예측한다고 가정
            if results.right_hand_landmarks or results.left_hand_landmarks:
                predicted_action = current_target_gloss
                confidence = 0.85
            else:
                predicted_action = "대기중"
                confidence = 0.0

            # 3. 예측된 수어와 타겟 자막(Gloss) 비교
            if confidence > threshold:
                if predicted_action == current_target_gloss:
                    is_matched = True
                else:
                    is_matched = False
            else:
                is_matched = False

        # 4. 화면에 결과 표시 (PIL을 이용해 한글 렌더링)
        image = cv2.flip(image, 1) # 화면 좌우 반전 후 텍스트 출력
        
        match_text = "일치 (정답!)" if is_matched else "불일치"
        match_color = (0, 255, 0) if is_matched else (0, 0, 255) # BGR
        
        # 한국어 텍스트 표시
        image = put_korean_text(image, f"현재 자막(Gloss): {current_target_gloss}", (10, 20), 30, (255, 255, 255))
        image = put_korean_text(image, f"내 수어 인식결과: {predicted_action} ({confidence*100:.1f}%)", (10, 70), 30, (255, 255, 255))
        image = put_korean_text(image, f"매칭 상태: {match_text}", (10, 120), 40, match_color)
        
        cv2.imshow('Real-time Sign Language Recognition', image)

        # Q키를 누르면 종료
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()