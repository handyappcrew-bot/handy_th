import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import ToastBanner from "@/components/ToastBanner";
import { formatPhone } from "@/utils/valid";
import { codeResend, codeVerify } from "@/api/public";

const CodeVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneDigits = (location.state as any)?.phone || "";
  const formattedPhone = formatPhone(phoneDigits);
  const type = location.state?.type || "normal";

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(180);
  const [isVerified, setIsVerified] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [sendCount, setSendCount] = useState(1);
  const [resendLimitError, setResendLimitError] = useState(false);
  const [toast, setToast] = useState<string | null>("인증번호를 발송 했어요.");

  console.log(type);

  // Timer
  useEffect(() => {
    if (isVerified || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isVerified, timer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // 인증번호 검증
  useEffect(() => {
    const verifyCode = async () => {
      if (code.length === 5 && !isVerified) {
        try {
          await codeVerify(formattedPhone, code);
          setIsVerified(true);
          setCodeError(false);
        } catch (err) {
          setCodeError(true);
        }
      }
    };
    verifyCode();
  }, [code, isVerified]);

  // 인증번호 재전송
  const handleResend = async () => {
    try {
      await codeResend(formattedPhone);
      setSendCount((c) => c + 1);
      setTimer(180);
      setCode("");
      setCodeError(false);
      setIsVerified(false);
      setResendLimitError(false);
      setToast("인증번호를 재발송 했어요.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (!isVerified) return;

    if (type == "normal") {
      navigate("/password", { state: { phone: phoneDigits } });
    }
    else {
      navigate("/profile-info", { state: { phone: phoneDigits, password: "", type } });
    }
  };

  return (
    <PageLayout
      title={
        <>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">
            회원가입을 위해
          </h1>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">
            본인 인증을 해주세요
          </h1>
        </>
      }
      subtitle="휴대폰 번호를 아이디로 사용해요"
      onBack={() => navigate("/")}
      toast={
        toast ? (
          <ToastBanner
            message={toast}
            visible={!!toast}
            onClose={() => setToast(null)}
          />
        ) : undefined
      }
      bottom={
        <button
          disabled={!isVerified}
          onClick={handleNext}
          className={`w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isVerified
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
            }`}
        >
          다음
        </button>
      }
    >
      {/* Phone field (read-only) + resend */}
      <div>
        <label className="text-[15px] font-medium text-foreground">
          휴대폰 번호 <span className="text-destructive">*</span>
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="tel"
            value={formattedPhone}
            readOnly
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3.5 text-[16px] text-muted-foreground outline-none"
          />
          <button
            onClick={handleResend}
            disabled={isVerified}
            className={`rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors ${isVerified
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
              }`}
          >
            재전송
          </button>
        </div>
        <p className="mt-2 text-[13px] text-primary">
          *위 휴대폰 번호로 발송된 인증 번호를 입력해주세요
        </p>
      </div>

      {/* Code input */}
      <div className="mt-6">
        <label className="text-[15px] font-medium text-foreground">
          인증번호 <span className="text-destructive">*</span>
        </label>
        <div className="relative mt-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={code}
            onChange={(e) => {
              if (isVerified) return;
              setCode(e.target.value.replace(/\D/g, "").slice(0, 5));
            }}
            placeholder="인증번호 5자리 입력"
            disabled={isVerified}
            className={`w-full rounded-xl border bg-background px-4 py-3.5 pr-16 text-[16px] outline-none transition-colors ${codeError
              ? "border-destructive"
              : isVerified
                ? "border-input text-muted-foreground"
                : "border-input"
              }`}
          />
          {!isVerified && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-primary font-medium">
              {formatTime(timer)}
            </span>
          )}
        </div>

        {codeError && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">올바르지 않은 인증번호에요. 인증번호를 확인해주세요</span>
          </div>
        )}

        {resendLimitError && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">인증번호는 하루 최대 5번까지 발송 가능해요</span>
          </div>
        )}

        {isVerified && (
          <div className="mt-2 flex items-center gap-1.5 text-success">
            <CheckCircle size={16} />
            <span className="text-[13px]">인증되었습니다</span>
          </div>
        )}

        {!isVerified && !resendLimitError && (
          <p className="mt-3 text-[14px] text-foreground underline">인증번호가 오지 않나요?</p>
        )}
      </div>
    </PageLayout>
  );
};

export default CodeVerifyPage;
