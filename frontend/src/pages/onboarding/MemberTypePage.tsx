import { useNavigate } from "react-router-dom";
import { Briefcase, User } from "lucide-react";

const MemberTypePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background px-5">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[26px] font-bold leading-tight text-foreground">회원 유형을</h1>
        <h1 className="text-[26px] font-bold leading-tight text-foreground">선택해주세요</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">유형에 맞는 서비스를 이용할 수 있어요</p>

        <div className="mt-10 flex flex-col gap-4">
          <button
            onClick={() => navigate("/owner/business-verify")}
            className="flex items-center gap-4 rounded-2xl border-2 border-input bg-card p-6 text-left transition-colors active:border-primary"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Briefcase size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-[18px] font-bold text-foreground">사장님</p>
              <p className="mt-0.5 text-[14px] text-muted-foreground">매장을 등록하고 직원을 관리해요</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/employee/business-verify")}
            className="flex items-center gap-4 rounded-2xl border-2 border-input bg-card p-6 text-left transition-colors active:border-primary"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-[18px] font-bold text-foreground">직원</p>
              <p className="mt-0.5 text-[14px] text-muted-foreground">매장 코드로 입사신청을 해요</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberTypePage;
