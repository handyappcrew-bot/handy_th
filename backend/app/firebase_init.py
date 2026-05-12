import os
import firebase_admin
from firebase_admin import credentials, messaging

key_path = os.getenv("FIREBASE_KEY_PATH")

if key_path and os.path.exists(key_path):
    cred = credentials.Certificate(key_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
else:
    print("⚠️  Firebase 키 파일 없음 — 푸시 알림 비활성화")


def send_push(token: str, title: str, body: str):
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={"title": title, "body": body},
        token=token,
        android=messaging.AndroidConfig(priority="high"),
    )
    result = messaging.send(message)
    print("FCM 결과:", result)
