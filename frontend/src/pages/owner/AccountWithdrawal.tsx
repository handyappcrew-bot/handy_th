import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STORES = [
  {
    name: "컴포즈커피 노랑진점",
    category: "음식/카페",
    address: "서울특별시 동작구 노랑진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    code: "123456",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
  {
    name: "텐퍼센트 커피 노랑진점",
    category: "음식/카페",
    address: "서울특별시 동작구 노랑진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    code: "123456",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
  {
    name: "메가커피 노랑진점",
    category: "음식/카페",
    address: "서울특별시 동작구 노랑진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    code: "123456",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
];

const CAUTION_ITEMS = [
  {
    text: "탈퇴 시 매장에 등록된 모든 근태 기록, 급여 내역, 매출 데이터 및 직원 정보 등 ",
    bold: "모든 매장 데이터가 삭제되며 복구되지 않아요.",
    rest: " 관련 법령에 따라 보관이 필요한 자료는 탈퇴 전에 별도로 저장해주세요.\n해당 매장에 등록된 직원의 계정도 함께 서비스 이용이 제한됩니다.",
  },
  {
    text: "급여 정산이 완료되지 않았거나 승인 대기 중인 근무 내역이 있는 경우, 탈퇴 전 반드시 확인 해주세요",
  },
  {
    text: "탈퇴 후 30일 동안 계정 정보가 보관되며, 30일 경과 후 모든 개인정보는 완전 삭제돼요.",
  },
  {
    text: "탈퇴 후 재가입 시 탈퇴 시점 기준 1일 후 가능해요.",
  },
];

const REASONS = [
  "사용 방법이 어렵거나 복잡했어요",
  "사용 중 오류가 자주 발생했어요",
  "필요한 기능이 부족했어요",
  "더 이상 일을 계속하지 않아요",
  "자주 사용하지 않아요",
  "기타 (직접 작성)",
];

export default function AccountWithdrawal() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"caution" | "stores" | "reason" | "done">("caution");
  const [agreed, setAgreed] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const canWithdraw = selectedReason !== null && (selectedReason !== "기타 (직접 작성)" || otherText.trim().length > 0);

  const handleBack = () => {
    if (step === "caution") navigate(-1);
    else if (step === "stores") setStep("caution");
    else if (step === "reason") setStep("stores");
  };

  const handleWithdraw = () => {
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen px-5">
          <h2 className="text-[22px] font-bold text-foreground text-center leading-tight">
            회원 탈퇴가<br />완료되었어요
          </h2>
          <div className="mt-10 w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-14 h-14 text-primary" />
          </div>
          <p className="mt-6 text-[15px] text-muted-foreground text-center leading-relaxed">
            지금까지 핸디를<br />이용해 주셔서 감사합니다
          </p>
        </div>
        <div className="px-5 pb-8">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center h-14 px-5 border-b border-border">
        <button onClick={handleBack} className="mr-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[18px] font-bold text-foreground">회원 탈퇴</h1>
      </div>
      </div>

      {step === "caution" && (
        <div className="">
          <div className="px-5 py-6">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              회원 탈퇴 전<br />유의사항을 확인해 주세요
            </h2>

            <div className="mt-6 bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-[14px] font-medium text-muted-foreground">회원 탈퇴 전 유의사항</span>
              </div>
              <ol className="space-y-4 pl-1">
                {CAUTION_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[14px] text-muted-foreground shrink-0">{i + 1}.</span>
                    <span className="text-[14px] text-muted-foreground leading-relaxed">
                      {item.text}
                      {item.bold && <span className="text-destructive font-bold">{item.bold}</span>}
                      {item.rest && item.rest}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="px-5 pb-8">
            <button
              onClick={() => setAgreed(!agreed)}
              className="flex items-start gap-3 mb-4"
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "bg-primary border-primary" : "border-border"}`}>
                {agreed && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              <span className="text-[14px] text-foreground text-left leading-relaxed">
                탈퇴 시 모든 계정 데이터가 삭제되며 복구되지 않음을 확인했습니다.
              </span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3.5 rounded-xl border border-border text-[15px] text-foreground font-medium bg-primary/5"
              >
                취소
              </button>
              <button
                onClick={() => setStep("stores")}
                disabled={!agreed}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "stores" && (
        <div className="">
          <div className="px-5 py-6">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              탈퇴 전 매장 정보를<br />다시 한 번 확인해 주세요
            </h2>

            <div className="mt-6 space-y-4">
              {STORES.map((store, i) => (
                <div key={i} className="border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                    <span className="text-[16px] font-bold text-foreground">{store.name}</span>
                  </div>
                  <div className="space-y-3">
                    <ConfirmRow label="업종" value={store.category} />
                    <ConfirmRow label="주소" value={store.address} />
                    <ConfirmRow label="대표자명" value={store.ceo} />
                    <ConfirmRow label="대표 번호" value={store.phone} />
                    <ConfirmRow label="매장 코드" value={store.code} isCode />
                    <ConfirmRow label="총 직원 수" value={store.staffCount} />
                    <ConfirmRow label="개업일" value={store.openDate} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pb-8">
            <div className="flex gap-3">
              <button
                onClick={() => setStep("caution")}
                className="flex-1 py-3.5 rounded-xl border border-border text-[15px] text-foreground font-medium bg-primary/5"
              >
                이전
              </button>
              <button
                onClick={() => setStep("reason")}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "reason" && (
        <div className="">
          <div className="px-5 py-6">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              서비스 개선을 위해<br />탈퇴 이유를 선택해 주세요
            </h2>
            <p className="text-[14px] text-muted-foreground mt-2">서비스 개선을 위해 의견을 남겨주세요</p>

            <div className="mt-6 space-y-1">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className="flex items-center gap-3 w-full py-4"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedReason === reason ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {selectedReason === reason && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <span className="text-[15px] text-foreground">{reason}</span>
                </button>
              ))}
            </div>

            {selectedReason === "기타 (직접 작성)" && (
              <div className="mt-2">
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value.slice(0, 100))}
                  placeholder="기타 사유 입력 (필수)"
                  className="w-full bg-background resize-none focus:outline-none text-[15px]" style={{ border: '1px solid #DBDCDF', borderRadius: '10px', padding: '16px', height: '112px', color: '#19191B' }}
                />
                <p className="text-right text-[14px] mt-1" style={{ color: '#AAB4BF' }}>{otherText.length}/100</p>
              </div>
            )}
          </div>

          <div className="px-5 pb-8">
            <div className="flex gap-3">
              <button
                onClick={() => setStep("stores")}
                className="flex-1 py-3.5 rounded-xl border border-border text-[15px] text-foreground font-medium bg-primary/5"
              >
                이전
              </button>
              <button
                onClick={() => setShowConfirmPopup(true)}
                disabled={!canWithdraw}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-40"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 팝업 */}
      <ConfirmDialog
        open={showConfirmPopup}
        onOpenChange={setShowConfirmPopup}
        title="회원 탈퇴"
        description={"탈퇴 시 모든 계정 데이터가\n삭제되고 복구되지 않아요\n정말 회원 탈퇴를 하시겠어요?"}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setShowConfirmPopup(false) },
          { label: "탈퇴하기", variant: "confirm", onClick: () => { setShowConfirmPopup(false); handleWithdraw(); } },
        ]}
      />
    </div>
      </div>
  );
}

function ConfirmRow({ label, value, isCode }: { label: string; value: string; isCode?: boolean }) {
  return (
    <div className="flex gap-4">
      <span className="text-[14px] text-muted-foreground min-w-[72px] shrink-0">{label}</span>
      <span className={`text-[14px] ${isCode ? "text-primary font-medium" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
