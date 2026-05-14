import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { formatPhone, validatePhone } from "@/utils/valid";
import { clearProfileInfoDraft } from "@/utils/signupDraft";

const PhoneVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = params.get("type") === "social" ? "social" : "general";
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const isValid = validatePhone(phone);
  const [errorMsg, setErrorMsg] = useState("");
  const showError = !!((touched && phone.length >= 10 && !isValid) || errorMsg);

  // 회원가입 첫 진입: 이전 미완료 시도의 잔존 draft 정리
  useEffect(() => {
    clearProfileInfoDraft();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setTouched(true);

    const valid = validatePhone(formatted);

    if (!valid && formatted.length >= 10) {
      setErrorMsg("올바르지 않은 휴대폰 번호 형식이에요.");
    } else {
      setErrorMsg("");
    }
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setErrorMsg("올바르지 않은 휴대폰 번호 형식이에요.");
      return;
    }
    const digits = phone.replace(/\D/g, "");

    try {
      const res = await fetch("/api/auth/signup/code/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: digits })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "요청 처리 중 문제가 발생했어요.");
        return;
      }

      navigate("/verify", { state: { phone: digits, type } });

    } catch (err) {
      console.error(err);
      setErrorMsg("네트워크 오류가 발생했어요. 다시 시도해주세요.");
    }
  };

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
      bottom={
        <button
          disabled={!isValid}
          onClick={handleSubmit}
          className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isValid
            ? "bg-primary text-primary-foreground"
            : "btn-disabled"
            }`}
        >
          인증번호 문자 보내기
        </button>
      }
    >
      <div>
        <label className="text-[15px] font-medium text-foreground">
          휴대폰 번호 <span className="text-destructive">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={handleChange}
          onFocus={() => setPhoneFocused(true)}
          onBlur={() => setPhoneFocused(false)}
          placeholder="숫자만 입력"
          style={{ outline: 'none', boxShadow: 'none' }}
          className={`mt-2 w-full rounded-xl border-2 bg-background px-4 py-3.5 text-[16px] transition-colors ${
            showError
              ? "border-input-error"
              : phoneFocused
                ? "border-input-focus"
                : "border-input"
            }`}
        />
        {showError && (
          <div className="mt-2 flex items-center gap-1.5 text-destructive">
            <AlertCircle size={16} />
            <span className="text-[13px]">{errorMsg}</span>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PhoneVerifyPage;
