import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const SignupCompletePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const name = state?.name || "회원";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        {/* Gradient check icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary">
          <CheckCircle size={48} className="text-primary-foreground" strokeWidth={2} />
        </div>

        <h1 className="text-[24px] font-bold text-foreground text-center">
          {name}님 반가워요
        </h1>
        <h1 className="text-[24px] font-bold text-foreground text-center">
          회원가입이 완료됐어요!
        </h1>

        <p className="mt-4 text-[15px] text-primary text-center">
          서비스 이용을 위해 회원 유형을 선택해 주세요
        </p>
      </div>

      <div className="px-5 pb-8">
        <button onClick={() => navigate("/onboarding/member-type")} className="w-full rounded-2xl bg-primary py-4 text-[17px] font-semibold text-primary-foreground">
          회원 유형 선택하기
        </button>
      </div>
    </div>
  );
};

export default SignupCompletePage;
