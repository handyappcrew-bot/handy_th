import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

export function TestButton() {
  const handlePushTest = async () => {
    try {
      console.log("🔔 푸시 권한 요청 시작");

      // 1️⃣ 권한 요청
      const perm = await PushNotifications.requestPermissions();
      console.log("perm:", perm);

      if (perm.receive !== "granted") {
        alert("알림 권한 거부됨");
        return;
      }

      // 2️⃣ 리스너 먼저 등록 (중요 ⭐)
      PushNotifications.addListener("registration", async (token) => {
        console.log("✅ PUSH TOKEN:", token.value);
        alert("토큰 발급 완료! Logcat 확인");

        // 👉 서버 전송 예시 (선택)
        // await fetch("/api/notifications/register", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ token: token.value }),
        // });

        // 3️⃣ 즉시 확인용 로컬 알림 (테스트)
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: "푸시 테스트 성공 🎉",
              body: "토큰 발급 + 알림 정상 동작",
              schedule: { at: new Date(Date.now() + 1000) },
            },
          ],
        });
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("❌ registrationError:", err);
      });

      PushNotifications.addListener("pushNotificationReceived", (n) => {
        console.log("📩 Foreground push:", n);
      });

      // 4️⃣ 등록 시작
      await PushNotifications.register();

    } catch (e) {
      console.error("푸시 테스트 실패:", e);
    }
  };

  return (
    <button
      onClick={handlePushTest}
      style={{
        padding: "12px 20px",
        background: "#4f46e5",
        color: "white",
        borderRadius: "8px",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      🔔 푸시 테스트
    </button>
  );
}
