import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const PasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneDigits = (location.state as any)?.phone || "";
  const type = (location.state as any)?.type === "social" ? "social" : "general";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const validLength = password.length >= 8 && password.length <= 16;
  const pwValid = hasLetter && hasNumber && validLength;
  const mismatch = confirm.length > 0 && password !== confirm;
  const confirmMatch = confirm.length > 0 && password === confirm;
  const canNext = pwValid && confirmMatch;

  const pwError = password.length > 0 && !pwValid;
  const pwBorder = pwError
    ? "border-input-error"
    : pwFocused
      ? "border-input-focus"
      : "border-input";
  const confirmBorder = mismatch
    ? "border-input-error"
    : confirmFocused
      ? "border-input-focus"
      : "border-input";

  const handleNext = () => {
    if (!canNext) return;
    navigate("/profile-info", { state: { phone: phoneDigits, password, type } });
  };

  return (
    <PageLayout
      headerTitle="회원가입"
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">비밀번호를</h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">입력해주세요</h2>
        </>
      }
      subtitle="영문, 숫자를 조합한 8~16자를 입력해주세요."
      onBack={() => navigate("/verify", { state: { phone: phoneDigits, type } })}
      bottom={
        <button
          disabled={!canNext}
          onClick={handleNext}
          className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${
            canNext
              ? "bg-primary text-primary-foreground"
              : "btn-disabled"
          }`}
        >
          다음
        </button>
      }
    >
      {/* Password */}
      <div>
        <label className="text-[15px] font-medium text-foreground">
          비밀번호 <span className="text-destructive">*</span>
        </label>
        <div className="relative mt-2">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            placeholder="비밀번호 입력"
            maxLength={16}
            style={{ outline: 'none', boxShadow: 'none' }}
            className={`w-full rounded-xl border-2 bg-background px-4 py-3.5 pr-12 text-[16px] transition-colors ${pwBorder}`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="pressable absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        {pwError && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">올바르지 않은 비밀번호 형식이에요</span>
          </div>
        )}
        {pwValid && (
          <div className="mt-2 flex items-center gap-1.5" style={{ color: '#10C97D' }}>
            <CheckCircle size={16} />
            <span className="text-[13px]">사용 가능한 비밀번호에요</span>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="mt-5">
        <label className="text-[15px] font-medium text-foreground">
          비밀번호 확인 <span className="text-destructive">*</span>
        </label>
        <div className="relative mt-2">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onFocus={() => setConfirmFocused(true)}
            onBlur={() => setConfirmFocused(false)}
            placeholder="비밀번호 확인"
            maxLength={16}
            style={{ outline: 'none', boxShadow: 'none' }}
            className={`w-full rounded-xl border-2 bg-background px-4 py-3.5 pr-12 text-[16px] transition-colors ${confirmBorder}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="pressable absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        {mismatch && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">비밀번호가 일치하지 않아요</span>
          </div>
        )}
        {confirmMatch && pwValid && (
          <div className="mt-2 flex items-center gap-1.5" style={{ color: '#10C97D' }}>
            <CheckCircle size={16} />
            <span className="text-[13px]">비밀번호가 일치해요</span>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PasswordPage;
