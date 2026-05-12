import { X } from "lucide-react";

interface BankSelectSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (bankName: string) => void;
}

const BANKS = [
  { name: "국민은행", image: "" },
  { name: "신한은행", image: "" },
  { name: "농협", image: "" },
  { name: "우리은행", image: "" },
  { name: "기업은행", image: "" },
  { name: "하나은행", image: "" },
  { name: "토스뱅크", image: "" },
  { name: "카카오뱅크", image: "" },
  { name: "새마을금고", image: "" },
  { name: "케이뱅크", image: "" },
  { name: "우체국", image: "" },
  { name: "SC제일은행", image: "" },
  { name: "IM뱅크", image: "" },
  { name: "부산은행", image: "" },
  { name: "광주은행", image: "" },
  { name: "경남은행", image: "" },
  { name: "신협", image: "" },
  { name: "산업은행", image: "" },
  { name: "수협은행", image: "" },
  { name: "한국씨티은행", image: "" },
  { name: "SBI저축은행", image: "" },
  { name: "제주은행", image: "" },
  { name: "전북은행", image: "" },
  { name: "산림조합중앙회", image: "" },
];

const BankSelectSheet = ({ open, onClose, onSelect }: BankSelectSheetProps) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 bg-background rounded-t-2xl max-h-[80vh] flex flex-col w-full max-w-[375px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[16px] font-semibold text-foreground">
            은행을 선택해주세요
          </span>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Bank Grid */}
        <div className="overflow-y-auto px-5 pb-8">
          <div className="grid grid-cols-3 gap-3">
            {BANKS.map((bank) => (
              <button
                key={bank.name}
                onClick={() => onSelect(bank.name)}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-[hsl(0,0%,97%)] hover:bg-[hsl(0,0%,94%)] transition-colors"
              >
                {/* Bank image placeholder */}
                <div className="w-10 h-10 rounded-full bg-[hsl(0,0%,88%)] flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">img</span>
                </div>
                <span className="text-[12px] text-foreground">{bank.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BankSelectSheet;
