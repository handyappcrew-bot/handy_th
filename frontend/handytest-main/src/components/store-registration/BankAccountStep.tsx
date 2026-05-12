import { useState } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";
import BankSelectSheet from "./BankSelectSheet";

interface BankAccountStepProps {
  store_id: number;
  onBack: () => void;
  onSubmit: (data: { bank: string; accountHolder: string; accountNumber: string }) => void;
}

const BankAccountStep = ({ store_id, onBack, onSubmit }: BankAccountStepProps) => {
  const [bank, setBank] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);

  const isFormComplete = bank && accountHolder.trim() && accountNumber.trim();

  const handleSubmit = async () => {
    if (!isFormComplete) return;

    try {
      const res = await fetch("/api/employee/member/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id,
          bank,
          accountName: accountHolder,
          accountNumber
        }),
      });

      if (res.ok) {
        onSubmit({ bank, accountHolder, accountNumber });
      } else {
        const result = await res.json();
        alert(result.detail || "신청에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAccountNumber(value);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen px-5 pt-4 pb-8">
        {/* Back button */}
        <button onClick={onBack} className="self-start p-0 mb-4">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        {/* Title */}
        <h1 className="text-[22px] font-bold leading-[1.4] text-foreground">
          급여를 받을
          <br />
          계좌번호를 입력해 주세요
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 mb-8">
          본인 명의의 계좌번호만 등록할 수 있어요
        </p>

        {/* 은행 */}
        <label className="text-[14px] text-muted-foreground mb-2">
          은행 <span className="text-[hsl(0,84.2%,60.2%)]">*</span>
        </label>
        <button
          onClick={() => setShowBankSheet(true)}
          className="w-full h-[52px] px-4 rounded-xl border border-[hsl(0,0%,90%)] bg-background flex items-center justify-between mb-6"
        >
          <span className={`text-[16px] ${bank ? "text-foreground" : "text-[hsl(0,0%,75%)]"}`}>
            {bank || "은행 선택"}
          </span>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* 예금주 */}
        <label className="text-[14px] text-muted-foreground mb-2">
          예금주 <span className="text-[hsl(0,84.2%,60.2%)]">*</span>
        </label>
        <input
          type="text"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="이름"
          className="w-full h-[52px] px-4 rounded-xl border border-[hsl(0,0%,90%)] bg-background text-foreground text-[16px] outline-none placeholder:text-[hsl(0,0%,75%)] focus:border-[#4261FF] mb-6"
        />

        {/* 계좌번호 */}
        <label className="text-[14px] text-muted-foreground mb-2">
          계좌번호 <span className="text-[hsl(0,84.2%,60.2%)]">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="숫자만 입력"
          className="w-full h-[52px] px-4 rounded-xl border border-[hsl(0,0%,90%)] bg-background text-foreground text-[16px] outline-none placeholder:text-[hsl(0,0%,75%)] focus:border-[#4261FF]"
        />

        <div className="flex-1" />

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          className={`w-full h-[54px] rounded-xl text-[16px] font-semibold transition-colors ${!isFormComplete
            ? "bg-[hsl(0,0%,90%)] text-[hsl(0,0%,60%)] cursor-not-allowed"
            : "bg-[hsl(234,80%,63%)] text-white"
            }`}
        >
          가입신청 하기
        </button>
      </div>

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
