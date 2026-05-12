import { useNavigate } from "react-router-dom";

const DevLogin = () => {
  const navigate = useNavigate();

  const enterAs = (role: "owner" | "employee") => {
    localStorage.setItem("devMode", "true");
    localStorage.setItem("currentRole", role);
    localStorage.setItem("currentStoreId", "1");
    navigate(role === "owner" ? "/owner/home" : "/employee/home", { replace: true });
  };

  const exitDevMode = () => {
    localStorage.removeItem("devMode");
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentStoreId");
    navigate("/", { replace: true });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", padding: "24px",
      backgroundColor: "#F4F5F8",
    }}>
      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "20px",
        padding: "32px 24px", width: "100%", maxWidth: "320px",
        boxShadow: "2px 2px 12px rgba(0,0,0,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "48px", height: "48px", borderRadius: "14px",
            background: "linear-gradient(135deg, #4261FF, #6b8cff)",
            marginBottom: "16px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{
          textAlign: "center", marginBottom: "6px",
          fontSize: "20px", fontWeight: "700", color: "#19191B",
        }}>
          개발 모드
        </div>
        <div style={{
          textAlign: "center", marginBottom: "32px",
          fontSize: "14px", color: "#70737B",
          lineHeight: "1.5",
        }}>
          로그인 없이 화면을 확인하세요
        </div>

        <button
          className="pressable"
          onClick={() => enterAs("owner")}
          style={{
            width: "100%", height: "56px", borderRadius: "12px",
            background: "linear-gradient(135deg, #4261FF, #6b8cff)",
            color: "#FFFFFF", fontSize: "16px", fontWeight: "600",
            border: "none", marginBottom: "10px", cursor: "pointer",
          }}
        >
          사장 화면으로 입장
        </button>

        <button
          className="pressable"
          onClick={() => enterAs("employee")}
          style={{
            width: "100%", height: "56px", borderRadius: "12px",
            backgroundColor: "#F4F5F8", color: "#19191B",
            fontSize: "16px", fontWeight: "600", border: "none",
            marginBottom: "24px", cursor: "pointer",
          }}
        >
          직원 화면으로 입장
        </button>

        <div style={{ borderTop: "1px solid #F7F7F8", paddingTop: "20px" }}>
          <button
            className="pressable"
            onClick={exitDevMode}
            style={{
              width: "100%", height: "44px", borderRadius: "10px",
              backgroundColor: "transparent", color: "#AAB4BF",
              fontSize: "13px", fontWeight: "500", border: "1px solid #DBDCDF",
              cursor: "pointer",
            }}
          >
            개발 모드 해제 후 로그인 화면으로
          </button>
        </div>

        <div style={{
          textAlign: "center", marginTop: "16px",
          fontSize: "11px", color: "#AAB4BF",
        }}>
          개발·테스트 전용 화면입니다
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
