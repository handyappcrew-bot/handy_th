import { useState } from "react";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

interface StoreCodeStepProps {
  onBack: () => void;
  onNext: () => void;
  onCodeVerified: (id: number, code: string, info: { name: string; address: string; phone: string; lat: number; lng: number }) => void;
}

type VerifyStatus = "idle" | "error" | "success";

const StoreCodeStep = ({ onBack, onNext, onCodeVerified }: StoreCodeStepProps) => {
  const [code, setCode] = useState("");
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
        setTimeout(() => {
          onNext();
        }, 1200);
      } else {
        setStatus("error");
        setErrMsg(data.detail || "오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("실제 에러 내용:", e); // 콘솔에 찍히는 내용을 확인하세요!
      setStatus("error");
      setErrMsg("데이터 처리 중 오류가 발생했습니다.");
    }
  };

  const getTitle = () => {
    if (status === "success") {
      return (
        <>
          등록할 매장의
          <br />
          사업자 인증을 진행할게요
        </>
      );
    }
    return (
      <>
        사장님에게 받은
        <br />
        매장 코드를 입력해 주세요
      </>
    );
  };

  const getBorderClass = () => {
    if (status === "error") return "border-[hsl(0,84.2%,60.2%)]";
    if (status === "success") return "border-[hsl(160,60%,55%)]";
    return "border-[hsl(0,0%,90%)] focus:border-[#4261FF]";
  };

  return (
    <div className="flex flex-col min-h-screen px-5 pt-4 pb-8">
      {/* Back button */}
      <button onClick={onBack} className="self-start p-0 mb-4">
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>

      {/* Title */}
      <h1 className="text-[22px] font-bold leading-[1.4] text-foreground mb-8">
        {getTitle()}
      </h1>

      {/* Label */}
      <label className="text-[14px] text-muted-foreground mb-2">
        매장 코드 <span className="text-[hsl(0,84.2%,60.2%)]">*</span>
      </label>

      {/* Input */}
      <input
        type="text"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        placeholder="매장 코드 입력"
        className={`w-full h-[52px] px-4 rounded-xl border ${getBorderClass()} bg-background text-foreground text-[16px] outline-none placeholder:text-[hsl(0,0%,75%)]`}
      />

      {/* Status message */}
      {status === "error" && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertCircle className="w-4 h-4 text-[hsl(0,84.2%,60.2%)]" />
          <span className="text-[13px] text-[hsl(0,84.2%,60.2%)]">
            {errMsg}
          </span>
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-1.5 mt-2">
          <CheckCircle className="w-4 h-4 text-[hsl(160,60%,55%)]" />
          <span className="text-[13px] text-[hsl(160,60%,55%)]">
            조회되었어요
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Button */}
      <button
        onClick={handleVerify}
        disabled={!code.trim() || status === "success"}
        className={`w-full h-[54px] rounded-xl text-[16px] font-semibold transition-colors ${!code.trim() || status === "success"
          ? "bg-[hsl(0,0%,90%)] text-[hsl(0,0%,60%)] cursor-not-allowed"
          : "bg-[hsl(234,80%,63%)] text-white"
          }`}
      >
        매장 코드 조회하기
      </button>
    </div>
  );
};

export default StoreCodeStep;
