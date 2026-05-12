import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface ContractAlertProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
}

const ContractAlert = ({ scrollRef }: ContractAlertProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = scrollRef?.current ?? window;
    const handleScroll = () => {
      const scrollTop = scrollRef?.current
        ? scrollRef.current.scrollTop
        : window.scrollY;
      setCollapsed(scrollTop > 30);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef]);

  const handleClick = () => {
    navigate("/profile/edit", { state: { scrollToContract: true } });
  };

  return (
    <div
      className="fixed z-40"
      style={{
        bottom: "calc(74px + env(safe-area-inset-bottom) + 10px)",
        right: "20px",
        left: collapsed ? "auto" : "20px",
        maxWidth: "calc(min(100vw, 512px) - 40px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <button
          onClick={handleClick}
          className="pressable"
          style={{
            backgroundColor: "#FF3D3D",
            borderRadius: "26px",
            height: "52px",
            width: collapsed ? "52px" : "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: collapsed ? 0 : "10px",
            padding: collapsed ? "0" : "0 14px 0 14px",
            overflow: "hidden",
            transition: "width 0.55s cubic-bezier(0.4,0,0.2,1), border-radius 0.55s ease",
            whiteSpace: "nowrap",
            boxShadow: "none",
          }}
        >
          <FileText style={{ color: "#FFEAE6", flexShrink: 0, width: "24px", height: "24px" }} />
          <span
            style={{
              color: "#FFEAE6",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              flex: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : "100%",
              textAlign: "left",
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.2s ease, max-width 0.55s ease, flex 0.55s ease",
              overflow: "hidden",
            }}
          >
            전체 필수 계약서를 제출 완료 해주세요
          </span>
        </button>
      </div>
    </div>
  );
};

export default ContractAlert;
