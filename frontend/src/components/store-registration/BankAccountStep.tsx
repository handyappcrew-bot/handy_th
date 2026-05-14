import { useState } from "react";
import { ChevronDown } from "lucide-react";
import BankSelectSheet from "./BankSelectSheet";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";

interface BankAccountStepProps {
  store_id: number;
  onBack: () => void;
  onSubmit: (data: { bank: string; accountHolder: string; accountNumber: string }) => void;
}

const BankAccountStep = ({ store_id, onBack, onSubmit }: BankAccountStepProps) => {
  const { toast } = useToast();
  const [bank, setBank] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [holderFocused, setHolderFocused] = useState(false);
  const [numberFocused, setNumberFocused] = useState(false);

  const isFormComplete = bank && accountHolder.trim() && accountNumber.trim();

  const handleSubmit = async () => {
    if (!isFormComplete) return;
    try {
      const res = await fetch("/api/employee/member/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id, bank, accountName: accountHolder, accountNumber }),
      });
      if (res.ok) {
        onSubmit({ bank, accountHolder, accountNumber });
      } else {
        const result = await res.json();
        toast({ description: result.detail || "신청에 실패했습니다.", variant: "destructive", duration: 2000 });
      }
    } catch (error) {
      toast({ description: "서버 통신 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 '-' 만 허용 (앱 규칙)
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setAccountNumber(value);
  };

  const fieldClass = (focused: boolean) =>
    `mt-2 w-full h-[52px] rounded-xl border-2 bg-background px-4 text-[16px] transition-colors ${focused ? "border-input-focus" : "border-input"}`;

  return (
    <>
      <PageLayout
        stickyHeader
        onBack={onBack}
        title={
          <>
            <h2 className="text-[22px] font-bold leading-tight text-foreground">급여를 받을</h2>
            <h2 className="text-[22px] font-bold leading-tight text-foreground">계좌번호를 입력해 주세요</h2>
          </>
        }
        subtitle="본인 명의의 계좌번호만 등록할 수 있어요"
        bottom={
          <button
            onClick={handleSubmit}
            disabled={!isFormComplete}
            className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isFormComplete ? "bg-primary text-primary-foreground" : "btn-disabled"}`}
          >
            가입신청 하기
          </button>
        }
      >
        {/* 은행 */}
        <div>
          <label className="text-[15px] font-medium text-foreground">
            은행 <span className="text-destructive">*</span>
          </label>
          <button
            onClick={() => setShowBankSheet(true)}
            className="pressable mt-2 flex w-full h-[52px] items-center justify-between rounded-xl border-2 border-input bg-background px-4 text-[16px]"
          >
            <span className={bank ? "text-foreground" : "text-[#AAB4BF]"}>{bank || "은행 선택"}</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 예금주 */}
        <div className="mt-5">
          <label className="text-[15px] font-medium text-foreground">
            예금주 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            onFocus={() => setHolderFocused(true)}
            onBlur={() => setHolderFocused(false)}
            placeholder="이름"
            style={{ outline: 'none', boxShadow: 'none' }}
            className={fieldClass(holderFocused)}
          />
        </div>

        {/* 계좌번호 */}
        <div className="mt-5">
          <label className="text-[15px] font-medium text-foreground">
            계좌번호 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={handleAccountNumberChange}
            onFocus={() => setNumberFocused(true)}
            onBlur={() => setNumberFocused(false)}
            placeholder="숫자와 '-' 포함 입력"
            style={{ outline: 'none', boxShadow: 'none' }}
            className={fieldClass(numberFocused)}
          />
        </div>
      </PageLayout>

      <BankSelectSheet
        open={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        onSelect={(bankName) => {
          setBank(bankName);
          setShowBankSheet(false);
        }}
      />
    </>
  );
};

export default BankAccountStep;
