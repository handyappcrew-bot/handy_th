import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/utils/valid";
import { codeResend, codeVerify } from "@/api/public";

const CodeVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const phoneDigits = (location.state as any)?.phone || "";
  const formattedPhone = formatPhone(phoneDigits);
  const type = (location.state as any)?.type === "social" ? "social" : "general";

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(180);
  const [isVerified, setIsVerified] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [resendLimitError, setResendLimitError] = useState(false);

  // 같은 5자리에 대해 verify를 두 번 호출하지 않도록 가드 (React strict/HMR 이중 호출 방지)
  const lastSubmittedRef = useRef<string>("");
  const inFlightRef = useRef<boolean>(false);
  const initialToastShownRef = useRef<boolean>(false);

  const isDev = import.meta.env.DEV;

  // 최초 진입 시 발송 토스트 (StrictMode 이중 호출 방지)
  useEffect(() => {
    if (initialToastShownRef.current) return;
    initialToastShownRef.current = true;
    toast({ description: "인증번호를 발송 했어요.", duration: 2000 });
  }, [toast]);

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
    if (code.length !== 5 || isVerified) return;
    if (lastSubmittedRef.current === code) return;
    if (inFlightRef.current) return;

    lastSubmittedRef.current = code;
    inFlightRef.current = true;
    (async () => {
      try {
        await codeVerify(formattedPhone, code);
        setIsVerified(true);
        setCodeError(false);
      } catch {
        setCodeError(true);
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [code, isVerified, formattedPhone]);

  // 인증번호 재전송
  const handleResend = async () => {
    try {
      await codeResend(formattedPhone);
      setTimer(180);
      setCode("");
      setCodeError(false);
      setIsVerified(false);
      setResendLimitError(false);
      lastSubmittedRef.current = "";
      toast({ description: "인증번호를 재발송 했어요.", duration: 2000 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (!isVerified) return;

    if (type === "general") {
      navigate("/password", { state: { phone: phoneDigits, type } });
    } else {
      navigate("/profile-info", { state: { phone: phoneDigits, password: "", type } });
    }
  };

  // 인증 완료 시 휴대폰/인증번호 input 공통 스타일 (외곽 #DBDCDF, bg #F7F7F8, text #AAB4BF)
  const verifiedFieldStyle: React.CSSProperties = {
    outline: 'none',
    boxShadow: 'none',
    borderColor: '#DBDCDF',
    backgroundColor: '#F7F7F8',
    color: '#AAB4BF',
  };

  const codeBorder = codeError
    ? "border-input-error"
    : codeFocused && !isVerified
      ? "border-input-focus"
      : "border-input";

  return (
    <PageLayout
      headerTitle="회원가입"
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">
            회원가입을 위해
          </h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">
            본인 인증을 해주세요
          </h2>
        </>
      }
      subtitle="휴대폰 번호를 아이디로 사용해요"
      onBack={() => navigate("/")}
      bottom={
        <button
          disabled={!isVerified}
          onClick={handleNext}
          className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isVerified
            ? "bg-primary text-primary-foreground"
            : "btn-disabled"
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
            style={verifiedFieldStyle}
            className="flex-1 rounded-xl border-2 px-4 py-3.5 text-[16px]"
          />
          <button
            onClick={handleResend}
            disabled={isVerified}
            className={`pressable rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors ${isVerified
              ? "btn-disabled"
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
              const next = e.target.value.replace(/\D/g, "").slice(0, 5);
              // 코드가 변경되면 새 시도이므로 직전 가드 해제
              if (next !== code) {
                lastSubmittedRef.current = "";
                setCodeError(false);
              }
              setCode(next);
            }}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            placeholder="인증번호 5자리 입력"
            disabled={isVerified}
            style={isVerified ? verifiedFieldStyle : { outline: 'none', boxShadow: 'none' }}
            className={`w-full rounded-xl border-2 ${isVerified ? '' : 'bg-background'} px-4 py-3.5 pr-16 text-[16px] transition-colors ${codeBorder}`}
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
          <div className="mt-2 flex items-center gap-1.5" style={{ color: '#10C97D' }}>
            <CheckCircle size={16} />
            <span className="text-[13px]">인증이 완료 되었어요.</span>
          </div>
        )}

        {!isVerified && !resendLimitError && (
          <p className="mt-3 text-[14px] text-foreground underline">인증번호가 오지 않나요?</p>
        )}

        {isDev && !isVerified && (
          <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
            <p className="text-[12px] text-primary">
              <strong>[개발 모드]</strong> 테스트 인증번호: <code className="font-mono font-bold">00000</code>
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CodeVerifyPage;
