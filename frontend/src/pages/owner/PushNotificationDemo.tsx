import { useState, useEffect, useRef } from "react";

// ── 더미 직원 데이터 ──────────────────────────────────────
const EMPLOYEES = [
  { id: 1, name: "김민지", role: "알바생", avatar: "#FF6B6B", initial: "김", shift: "09:00 ~ 18:00" },
  { id: 2, name: "이준호", role: "알바생", avatar: "#4ECDC4", initial: "이", shift: "12:00 ~ 21:00" },
  { id: 3, name: "박서연", role: "알바생", avatar: "#45B7D1", initial: "박", shift: "14:00 ~ 22:00" },
];

const EVENT_TYPES = {
  checkin:  { label: "출근",   icon: "🟢", color: "#10C97D", bg: "rgba(16,201,125,0.08)" },
  checkout: { label: "퇴근",   icon: "🔴", color: "#FF6B6B", bg: "rgba(255,107,107,0.08)" },
  late:     { label: "지각",   icon: "🟡", color: "#FFB347", bg: "rgba(255,179,71,0.08)"  },
  request:  { label: "휴가신청", icon: "📋", color: "#4261FF", bg: "rgba(66,97,255,0.08)"  },
};

function timeStr() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

// ── 브라우저 알림 권한 요청 ────────────────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const result = await Notification.requestPermission();
  return result;
}

// ── 브라우저 OS 알림 발송 ─────────────────────────────────
function sendBrowserNotification(title, body, icon = "🔔") {
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>" + icon + "</text></svg>" });
}

export default function PushNotificationDemo() {
  const [role, setRole]           = useState("owner"); // "owner" | "employee"
  const [selectedEmp, setSelectedEmp] = useState(EMPLOYEES[0]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]       = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [permission, setPermission] = useState(Notification?.permission || "default");
  const [toasts, setToasts]       = useState([]);
  const [loading, setLoading]     = useState(null); // 어떤 이벤트가 로딩 중인지
  const panelRef = useRef(null);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 알림 추가 함수
  const addNotification = (emp, type) => {
    const ev = EVENT_TYPES[type];
    const notif = {
      id: Date.now(),
      empId: emp.id,
      empName: emp.name,
      empAvatar: emp.avatar,
      empInitial: emp.initial,
      type,
      label: ev.label,
      icon: ev.icon,
      color: ev.color,
      bg: ev.bg,
      time: timeStr(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
    setUnread(prev => prev + 1);

    // 인앱 토스트
    const toastId = Date.now() + Math.random();
    setToasts(prev => [...prev, { id: toastId, emp, ev, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3500);

    // OS 브라우저 알림
    sendBrowserNotification(
      `${ev.icon} ${emp.name}님이 ${ev.label}했어요`,
      `${timeStr()} · ${emp.shift}`,
      ev.icon
    );
  };

  // 이벤트 시뮬레이션 (알바생 화면에서 버튼 클릭)
  const handleEvent = async (type) => {
    setLoading(type);
    await new Promise(r => setTimeout(r, 600)); // 짧은 로딩 효과
    addNotification(selectedEmp, type);
    setLoading(null);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handlePermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const empCheckedIn = notifications.some(n => n.empId === selectedEmp.id && n.type === "checkin" && !notifications.find(m => m.empId === selectedEmp.id && m.type === "checkout" && m.id > n.id));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F8FA", fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>

      {/* ── 상단 역할 전환 탭 ── */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #EBEBEB", padding: "0 20px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#19191B" }}>
            {role === "owner" ? "🏪 사장 화면" : `👤 ${selectedEmp.name} (알바생) 화면`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {["owner", "employee"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                backgroundColor: role === r ? "#4261FF" : "#F0F0F0",
                color: role === r ? "#FFFFFF" : "#70737B",
                transition: "all 0.15s"
              }}>
                {r === "owner" ? "사장" : "알바생"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 100px" }}>

        {/* ── 알림 권한 배너 ── */}
        {permission !== "granted" && (
          <div style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#F57F17", margin: 0 }}>🔔 알림 권한이 필요해요</p>
              <p style={{ fontSize: 12, color: "#795548", margin: "2px 0 0" }}>
                {permission === "denied" ? "브라우저 설정에서 알림을 허용해주세요" : "OS 레벨 Push 알림 테스트를 위해 권한을 허용해주세요"}
              </p>
            </div>
            {permission !== "denied" && (
              <button onClick={handlePermission} style={{ padding: "6px 14px", backgroundColor: "#FF8F00", color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                허용하기
              </button>
            )}
          </div>
        )}

        {/* ══ 사장 화면 ══════════════════════════════════════ */}
        {role === "owner" && (
          <>
            {/* 알림센터 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#19191B", margin: 0 }}>직원 현황</h2>
              <div ref={panelRef} style={{ position: "relative" }}>
                <button onClick={() => { setShowPanel(!showPanel); if (!showPanel) markAllRead(); }}
                  style={{ position: "relative", width: 42, height: 42, borderRadius: 12, backgroundColor: "#F0F0F0", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  🔔
                  {unread > 0 && (
                    <span style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, backgroundColor: "#FF3D3D", borderRadius: "50%", fontSize: 10, fontWeight: 700, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #FFF" }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {/* 알림 패널 */}
                {showPanel && (
                  <div style={{ position: "absolute", top: 50, right: 0, width: 320, backgroundColor: "#FFFFFF", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #EBEBEB", zIndex: 100, overflow: "hidden" }}>
                    <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#19191B" }}>알림</span>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: 12, color: "#4261FF", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>모두 읽음</button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center" }}>
                          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🔕</p>
                          <p style={{ fontSize: 14, color: "#9EA3AD", margin: 0 }}>아직 알림이 없어요</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #F7F8FA", backgroundColor: n.read ? "#FFFFFF" : n.bg, display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: n.empAvatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>
                            {n.empInitial}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#19191B", margin: "0 0 2px" }}>
                              {n.icon} {n.empName}님이 <span style={{ color: n.color }}>{n.label}</span>했어요
                            </p>
                            <p style={{ fontSize: 12, color: "#9EA3AD", margin: 0 }}>{n.time}</p>
                          </div>
                          {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#4261FF", marginTop: 4, flexShrink: 0 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 직원 카드 목록 */}
            {EMPLOYEES.map(emp => {
              const lastEvent = notifications.find(n => n.empId === emp.id);
              const isIn = notifications.some(n => n.empId === emp.id && n.type === "checkin" && !notifications.find(m => m.empId === emp.id && m.type === "checkout" && m.id > n.id));
              return (
                <div key={emp.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #EBEBEB", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: emp.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#FFF", flexShrink: 0, position: "relative" }}>
                    {emp.initial}
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 13, height: 13, borderRadius: "50%", backgroundColor: isIn ? "#10C97D" : "#DBDCDF", border: "2px solid #FFF" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#19191B" }}>{emp.name}</span>
                      <span style={{ fontSize: 12, color: "#9EA3AD" }}>{emp.role}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#70737B", margin: "2px 0 0" }}>근무 {emp.shift}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, backgroundColor: isIn ? "rgba(16,201,125,0.1)" : "#F7F8FA", color: isIn ? "#10C97D" : "#9EA3AD" }}>
                      {isIn ? "근무중" : lastEvent ? EVENT_TYPES[lastEvent.type]?.label + "함" : "미출근"}
                    </span>
                    {lastEvent && <p style={{ fontSize: 11, color: "#9EA3AD", margin: "4px 0 0" }}>{lastEvent.time}</p>}
                  </div>
                </div>
              );
            })}

            {/* 최근 알림 피드 */}
            {notifications.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#19191B", marginBottom: 12 }}>최근 이벤트</h3>
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F0F0F0" }}>
                    <span style={{ fontSize: 18 }}>{n.icon}</span>
                    <span style={{ fontSize: 14, color: "#19191B", flex: 1 }}>
                      <strong>{n.empName}</strong>님 {n.label}
                    </span>
                    <span style={{ fontSize: 12, color: "#9EA3AD" }}>{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ 알바생 화면 ════════════════════════════════════ */}
        {role === "employee" && (
          <>
            {/* 알바생 선택 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#70737B", marginBottom: 8, fontWeight: 500 }}>직원 선택 (역할 시뮬레이션)</p>
              <div style={{ display: "flex", gap: 8 }}>
                {EMPLOYEES.map(emp => (
                  <button key={emp.id} onClick={() => setSelectedEmp(emp)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: selectedEmp.id === emp.id ? `2px solid ${emp.avatar}` : "2px solid #EBEBEB", backgroundColor: selectedEmp.id === emp.id ? "rgba(66,97,255,0.05)" : "#FFF", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: emp.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FFF", margin: "0 auto 4px" }}>{emp.initial}</div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#19191B", margin: 0 }}>{emp.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 출퇴근 카드 */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, marginBottom: 16, border: "1px solid #EBEBEB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: selectedEmp.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#FFF" }}>
                  {selectedEmp.initial}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#19191B", margin: 0 }}>{selectedEmp.name}</p>
                  <p style={{ fontSize: 13, color: "#70737B", margin: "2px 0 0" }}>오늘 근무 {selectedEmp.shift}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleEvent("checkin")}
                  disabled={loading !== null || empCheckedIn}
                  style={{ flex: 1, height: 52, borderRadius: 12, border: "none", cursor: empCheckedIn ? "default" : "pointer", fontSize: 15, fontWeight: 700, backgroundColor: empCheckedIn ? "#F0F0F0" : "#10C97D", color: empCheckedIn ? "#9EA3AD" : "#FFF", transition: "all 0.2s", opacity: loading === "checkin" ? 0.7 : 1 }}>
                  {loading === "checkin" ? "⏳ 처리중..." : empCheckedIn ? "✅ 출근 완료" : "🟢 출근하기"}
                </button>
                <button
                  onClick={() => handleEvent("checkout")}
                  disabled={loading !== null || !empCheckedIn}
                  style={{ flex: 1, height: 52, borderRadius: 12, border: "none", cursor: !empCheckedIn ? "default" : "pointer", fontSize: 15, fontWeight: 700, backgroundColor: !empCheckedIn ? "#F0F0F0" : "#FF6B6B", color: !empCheckedIn ? "#9EA3AD" : "#FFF", transition: "all 0.2s", opacity: loading === "checkout" ? 0.7 : 1 }}>
                  {loading === "checkout" ? "⏳ 처리중..." : "🔴 퇴근하기"}
                </button>
              </div>
            </div>

            {/* 기타 이벤트 */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, border: "1px solid #EBEBEB" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#70737B", margin: "0 0 14px" }}>기타 알림 테스트</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleEvent("late")} disabled={loading !== null}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: "1px solid #FFB347", backgroundColor: "rgba(255,179,71,0.08)", color: "#FF8F00", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  🟡 지각 알림
                </button>
                <button onClick={() => handleEvent("request")} disabled={loading !== null}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: "1px solid #4261FF", backgroundColor: "rgba(66,97,255,0.08)", color: "#4261FF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  📋 휴가 신청
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: "12px 16px", backgroundColor: "#F0F3FF", borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: "#4261FF", margin: 0, fontWeight: 500 }}>
                💡 버튼을 누르면 사장 화면에 실시간 알림이 전달돼요. 브라우저 알림 권한을 허용하면 OS 알림도 확인할 수 있어요.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── 인앱 토스트 알림 ── */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, width: "calc(100% - 40px)", maxWidth: 440, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ backgroundColor: "#19191B", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", animation: "slideDown 0.3s ease" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: t.emp.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>
              {t.emp.initial}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>
                {t.ev.icon} {t.emp.name}님이 {t.ev.label}했어요
              </p>
              <p style={{ fontSize: 12, color: "#9EA3AD", margin: "2px 0 0" }}>{timeStr()}</p>
            </div>
            <span style={{ fontSize: 18 }}>{t.ev.icon}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
