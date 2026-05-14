import { useLocation, useNavigate } from "react-router-dom";

const SignupCompletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const name = state?.name || "회원";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        {/* 체크 아이콘 (sign-in-check.png, 80×80) */}
        <img
          src="/images/icon/sign-in-check.png"
          alt="회원가입 완료"
          width={80}
          height={80}
          className="mb-8"
          draggable={false}
        />

        {/* 제목 — #19191B / semibold / 24px / -2% */}
        <h1
          className="text-center"
          style={{ color: '#19191B', fontWeight: 600, fontSize: '24px', letterSpacing: '-0.02em', lineHeight: 1.4 }}
        >
          {name}님 반가워요
        </h1>
        <h1
          className="text-center"
          style={{ color: '#19191B', fontWeight: 600, fontSize: '24px', letterSpacing: '-0.02em', lineHeight: 1.4 }}
        >
          회원가입이 완료됐어요!
        </h1>

        {/* 부제 — #7488FE / medium / 16px / -2% */}
        <p
          className="mt-4 text-center"
          style={{ color: '#7488FE', fontWeight: 500, fontSize: '16px', letterSpacing: '-0.02em' }}
        >
          서비스 이용을 위해 회원 유형을 선택해 주세요
        </p>
      </div>

      <div className="px-5 pb-8">
        <button
          onClick={() => navigate("/onboarding/member-type")}
          className="pressable w-full rounded-2xl bg-primary py-4 text-[17px] font-semibold text-primary-foreground"
        >
          회원 유형 선택하기
        </button>
      </div>
    </div>
  );
};

export default SignupCompletePage;
