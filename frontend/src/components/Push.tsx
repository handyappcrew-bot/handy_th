import { useEffect, useState } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

export default function Push() {
    const [value, setValue] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        initPush();
    }, []);

    const initPush = async () => {

        await LocalNotifications.requestPermissions();

        await LocalNotifications.createChannel({
            id: "push_channel",
            name: "Push Channel",
            importance: 5,
        });

        // 🔥 리스너 먼저 등록
        PushNotifications.addListener("registration", t => {
            console.log("🔥 TOKEN:", t.value);
            alert("토큰 발급됨");
            setToken(t.value);
        });

        PushNotifications.addListener("registrationError", e => {
            console.log("토큰 에러:", e);
        });

        PushNotifications.addListener("pushNotificationReceived", async n => {
            alert("푸시 수신됨");


            const title = n.data?.title || n.title;
            const body = n.data?.body || n.body;

            await LocalNotifications.schedule({
                notifications: [{
                    id: 1,
                    title,
                    body,
                    channelId: "push_channel"
                }]
            });
        });


        PushNotifications.addListener("pushNotificationActionPerformed", n => {
            console.log("알림 클릭:", n);
        });

        // 🔥 그 다음 권한 + register
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") {
            alert("푸시 권한 거부됨");
            return;
        }

        await PushNotifications.register();
    };

    const sendPush = async () => {
        if (!value) return alert("값 입력");
        if (!token) return alert("토큰 없음");

        await fetch("http://10.0.2.2:8000/api/community", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token,
                value: Number(value),
            }),
        });

        alert("푸시 요청 보냄");
    };

    // 🔥 로컬 알림 단독 테스트 버튼
    const testLocal = async () => {
        await LocalNotifications.schedule({
            notifications: [
                {
                    id: 999,
                    title: "로컬 테스트",
                    body: "이게 뜨면 로컬 알림 정상",
                    channelId: "push_channel"
                }
            ]
        });
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>푸시 테스트</h2>

            <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
            />

            <button onClick={sendPush}>푸시 보내기</button><br></br>
            <button onClick={testLocal}>로컬알림 테스트</button>

            <div>
                <small>토큰: {token.slice(0, 25)}...</small>
            </div>
        </div>
    );
}
