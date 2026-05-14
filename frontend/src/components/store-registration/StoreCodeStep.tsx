import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";

interface StoreCodeStepProps {
  onBack: () => void;
  onNext: () => void;
  onCodeVerified: (id: number, code: string, info: { name: string; address: string; phone: string; lat: number; lng: number }) => void;
}

type VerifyStatus = "idle" | "error" | "success";

const StoreCodeStep = ({ onBack, onNext, onCodeVerified }: StoreCodeStepProps) => {
  const [code, setCode] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [errMsg, setErrMsg] = useState("");

  const handleVerify = async () => {
    if (!code.trim()) return;
    try {
      const res = await fetch("/api/employee/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        onCodeVerified(data.id, code, data);
        setTimeout(() => onNext(), 1200);
      } else {
        setStatus("error");
        setErrMsg(data.detail || "오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("실제 에러 내용:", e);
      setStatus("error");
      setErrMsg("데이터 처리 중 오류가 발생했습니다.");
    }
  };

  const isSuccess = status === "success";
  const isErrorState = status === "error";

  const codeBorder = isErrorState
    ? "border-input-error"
    : codeFocused && !isSuccess
      ? "border-input-focus"
      : "border-input";

  // 인증 완료된 readonly input 스타일 (회원가입 CodeVerify와 동일)
  const verifiedFieldStyle: React.CSSProperties = {
    outline: 'none',
    boxShadow: 'none',
    borderColor: '#DBDCDF',
    backgroundColor: '#F7F7F8',
    color: '#AAB4BF',
  };

  return (
    <PageLayout
      stickyHeader
      onBack={onBack}
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">사장님에게 받은</h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">매장 코드를 입력해 주세요</h2>
        </>
      }
      bottom={
        <button
          onClick={handleVerify}
          disabled={!code.trim() || isSuccess}
          className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${(!code.trim() || isSuccess)
            ? "btn-disabled"
            : "bg-primary text-primary-foreground"
            }`}
        >
          매장 코드 조회하기
        </button>
      }
    >
      {/* 매장 코드 */}
      <div>
        <label className="text-[15px] font-medium text-foreground">
          매장 코드 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          onFocus={() => setCodeFocused(true)}
          onBlur={() => setCodeFocused(false)}
          placeholder="매장 코드 입력"
          readOnly={isSuccess}
          style={isSuccess ? verifiedFieldStyle : { outline: 'none', boxShadow: 'none' }}
          className={`mt-2 w-full h-[52px] rounded-xl border-2 px-4 text-[16px] transition-colors ${isSuccess ? '' : `bg-background ${codeBorder}`}`}
        />
        {isErrorState && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">{errMsg}</span>
          </div>
        )}
        {isSuccess && (
          <div className="mt-2 flex items-center gap-1.5" style={{ color: '#10C97D' }}>
            <CheckCircle size={16} />
            <span className="text-[13px]">조회되었어요</span>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default StoreCodeStep;
