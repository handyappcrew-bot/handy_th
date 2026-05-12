import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const PasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneDigits = (location.state as any)?.phone || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const validLength = password.length >= 8 && password.length <= 16;
  const pwValid = hasLetter && hasNumber && validLength;
  const mismatch = confirm.length > 0 && password !== confirm;
  const confirmMatch = confirm.length > 0 && password === confirm;
  const canNext = pwValid && confirmMatch;

  const handleNext = () => {
    if (!canNext) return;
    navigate("/profile-info", { state: { phone: phoneDigits, password } });
  };

  return (
    <PageLayout
      title={
        <>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">비밀번호를</h1>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">입력해주세요</h1>
        </>
      }
      subtitle="영문, 숫자를 조합한 8~16자를 입력해주세요."
      onBack={() => navigate("/verify", { state: { phone: phoneDigits } })}
      bottom={
        <button
          disabled={!canNext}
          onClick={handleNext}
          className={`w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${
            canNext
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
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
            placeholder="비밀번호 입력"
            maxLength={16}
            className={`w-full rounded-xl border bg-background px-4 py-3.5 pr-12 text-[16px] outline-none transition-colors ${
              password.length > 0 && !pwValid ? "border-destructive" : "border-input"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        {password.length > 0 && !pwValid && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">올바르지 않은 비밀번호 형식이에요</span>
          </div>
        )}
        {pwValid && (
          <div className="mt-2 flex items-center gap-1.5 text-success">
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
            placeholder="비밀번호 확인"
            maxLength={16}
            className={`w-full rounded-xl border bg-background px-4 py-3.5 pr-12 text-[16px] outline-none transition-colors ${
              mismatch ? "border-destructive" : "border-input"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
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
          <div className="mt-2 flex items-center gap-1.5 text-success">
            <CheckCircle size={16} />
            <span className="text-[13px]">비밀번호가 일치해요</span>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PasswordPage;
