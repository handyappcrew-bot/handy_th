import { Check } from "lucide-react";

const RegistrationComplete = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      {/* Title */}
      <h1 className="text-[22px] font-bold leading-[1.4] text-foreground text-center mb-12">
        작성한 회원 정보가
        <br />
        사장님에게 전달됐어요
      </h1>

      {/* Illustration */}
      <div className="relative w-[140px] h-[140px] mb-8">
        {/* Document */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[100px] h-[120px] bg-[hsl(230,80%,92%)] rounded-lg relative">
            {/* Lines on document */}
            <div className="absolute top-8 left-4 right-6 space-y-2.5">
              <div className="h-[3px] bg-[hsl(230,30%,75%)] rounded-full" />
              <div className="h-[3px] bg-[hsl(230,30%,75%)] rounded-full w-[85%]" />
              <div className="h-[3px] bg-[hsl(230,30%,75%)] rounded-full w-[70%]" />
              <div className="h-[3px] bg-[hsl(230,30%,75%)] rounded-full w-[55%]" />
            </div>
            {/* Folded corner */}
            <div className="absolute top-0 right-0 w-6 h-6">
              <div className="w-0 h-0 border-l-[24px] border-l-[hsl(234,80%,63%)] border-b-[24px] border-b-[hsl(230,80%,92%)]" />
            </div>
          </div>
        </div>

        {/* Checkmark circle */}
        <div className="absolute bottom-2 right-4 w-12 h-12 bg-[hsl(234,80%,63%)] rounded-full flex items-center justify-center">
          <Check className="w-6 h-6 text-white" strokeWidth={3} />
        </div>
      </div>

      {/* Sub text */}
      <p className="text-[15px] text-[hsl(234,80%,63%)] text-center leading-[1.6]">
        사장님이 가입 정보를 확인하고 있어요
        <br />
        승인되면 알림으로 알려드릴게요
      </p>
    </div>
  );
};

export default RegistrationComplete;
