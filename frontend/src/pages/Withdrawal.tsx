import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const reasons = [
  "사용법이 복잡하고어려웠어요",
  "더 이상 일을 계속하지 않아요",
  "자주 사용하지 않았어요",
  "사용 중 잦은 오류가 발생했어요",
  "기타 (직접 작성)",
];

const Withdrawal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const isOther = selectedReason === "기타 (직접 작성)";
  const canWithdraw = selectedReason !== null && (!isOther || otherText.trim().length > 0);
  const goBack = () => { if (step === 2) setStep(1); else navigate(-1); };

  // 완료 화면
  if (completed) return (
    <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>회원 탈퇴</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', lineHeight: '1.4' }}>
          회원 탈퇴가<br />완료되었어요
        </h2>
        <div className="mt-10 w-[200px] h-[200px] rounded-2xl" style={{ backgroundColor: '#F7F7F8' }} />
        <p className="mt-6 text-center" style={{ fontSize: '16px', color: '#70737B', lineHeight: '1.6' }}>
          지금까지 핸디를<br />이용해 주셔서 감사합니다.
        </p>
      </div>
      <div className="px-5 pb-8">
        <button onClick={() => navigate("/")} className="w-full rounded-2xl py-4 font-semibold"
          style={{ backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '16px' }}>
          확인
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={goBack} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>회원 탈퇴</h1>
      </div>

      <div className="flex-1 px-5 pb-4">
        {/* Step 1 - 유의사항 */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
              회원 탈퇴 전<br />유의사항을 확인해주세요
            </h2>

            {/* 유의사항 박스 */}
            <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#F7F7F8' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #FF3D3D' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF3D3D', lineHeight: 1 }}>!</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }}>탈퇴 전 유의사항</span>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-2" style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.6' }}>
                  <span className="flex-shrink-0">1.</span>
                  <span>회원 탈퇴 시 근태 기록, 급여 명세서, 출퇴근 내역, 마감 보고, 공지 확인 기록 등 <span style={{ color: '#FF3D3D', fontWeight: 700 }}>모든 데이터가 삭제되며 복구되지 않아요.</span></span>
                </li>
                <li className="flex gap-2" style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.6' }}>
                  <span className="flex-shrink-0">2.</span>
                  <span>탈퇴 후 30일 동안 계정 정보가 보관되며, 30일 경과 후 모든 개인정보는 완전 삭제돼요.</span>
                </li>
                <li className="flex gap-2" style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.6' }}>
                  <span className="flex-shrink-0">3.</span>
                  <span>탈퇴 후 재가입 시 탈퇴 시점 기준 1일 후 가능해요.</span>
                </li>
              </ol>
            </div>

            {/* 동의 체크박스 */}
            <button onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 w-full text-left">
              <div className="flex-shrink-0 flex items-center justify-center"
                style={{ width: '24px', height: '24px', borderRadius: '6px', marginTop: '2px', backgroundColor: agreed ? '#4261FF' : '#FFFFFF', border: agreed ? '2px solid #4261FF' : '2px solid #DBDCDF' }}>
                {agreed && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', lineHeight: '1.6' }}>
                탈퇴 시 모든 계정 데이터가 삭제되고 복구되지 않음을 이해했습니다
              </span>
            </button>
          </>
        )}

        {/* Step 2 - 탈퇴 사유 */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', lineHeight: '1.4', marginTop: '16px' }}>
              탈퇴하시는 사유가<br />무엇인가요?
            </h2>
            <p style={{ fontSize: '14px', color: '#AAB4BF', letterSpacing: '-0.02em', marginTop: '8px', marginBottom: '32px' }}>
              더 나은 서비스 제공을 위해 이유를 선택해주세요
            </p>

            <div className="space-y-6">
              {reasons.map((reason) => (
                <button key={reason} onClick={() => setSelectedReason(reason)} className="flex items-center gap-3 w-full text-left">
                  <div className="flex items-center justify-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: selectedReason === reason ? '#4261FF' : '#FFFFFF', border: selectedReason === reason ? '2px solid #4261FF' : '2px solid #DBDCDF' }}>
                    {selectedReason === reason && (
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>{reason}</span>
                </button>
              ))}
            </div>

            {/* 기타 텍스트 입력 */}
            {isOther && (
              <div className="mt-4">
                <textarea
                  value={otherText}
                  onChange={(e) => { if (e.target.value.length <= 100) setOtherText(e.target.value); }}
                  placeholder="기타 사유 입력 (필수)"
                  className="w-full rounded-xl px-4 py-3 focus:outline-none resize-none"
                  style={{ height: '120px', border: '1px solid #DBDCDF', fontSize: '15px', color: '#19191B', letterSpacing: '-0.02em' }}
                />
                <p className="text-right" style={{ fontSize: '14px', color: '#AAB4BF', marginTop: '4px' }}>{otherText.length}/100</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-8 flex gap-3">
        <button onClick={goBack} className="flex-1 rounded-2xl py-4 font-semibold"
          style={{ backgroundColor: '#E8F3FF', color: '#4261FF', fontSize: '16px' }}>
          {step === 1 ? "취소" : "이전"}
        </button>
        <button
          onClick={() => {
            if (step === 1) { setStep(2); }
            else if (canWithdraw) setConfirmDialogOpen(true);
          }}
          disabled={step === 1 ? !agreed : !canWithdraw}
          className="flex-1 rounded-2xl py-4 font-semibold"
          style={{ backgroundColor: (step === 1 ? agreed : canWithdraw) ? '#4261FF' : '#E5E7EB', color: (step === 1 ? agreed : canWithdraw) ? '#FFFFFF' : '#9CA3AF', fontSize: '16px' }}>
          {step === 1 ? "다음" : "탈퇴하기"}
        </button>
      </div>

      <ConfirmDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} title="회원 탈퇴"
        description={<>탈퇴 시 모든 계정 데이터가<br />삭제되고 복구되지 않아요<br />정말 회원 탈퇴를 하시겠어요?</>}
        buttons={[{ label: "취소", onClick: () => setConfirmDialogOpen(false), variant: "cancel" }, { label: "탈퇴하기", onClick: () => { setConfirmDialogOpen(false); setCompleted(true); } }]} />
    </div>
  );
};

export default Withdrawal;
