import { createPortal } from "react-dom";
import { X, Check, Plus } from "lucide-react";

interface Account {
  id: string;
  storeName: string;
  employeeType: "사장님" | "직원";
}

interface AccountBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function AccountBottomSheet({
  open,
  onOpenChange,
  accounts,
  selectedId,
  onSelect,
}: AccountBottomSheetProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card px-5 pb-8 pt-6 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">계정 유형 선택</h2>
          <button onClick={() => onOpenChange(false)}>
            <X className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Account list */}
        <div className="flex flex-col">
          {accounts.map((account) => {
            const isSelected = account.id === selectedId;
            return (
              <button
                key={account.id}
                onClick={() => {
                  onSelect(account.id);
                  onOpenChange(false);
                }}
                className={`pressable flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors ${
                  isSelected ? "bg-[hsl(var(--notice-card-bg))]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-base font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {account.storeName}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isSelected
                        ? "bg-[hsl(var(--role-badge))] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {account.employeeType}
                  </span>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>

        {/* Add account */}
        <button className="pressable mt-4 flex items-center gap-1.5 px-4 py-3 text-base font-medium text-muted-foreground">
          <Plus className="h-5 w-5" />
          계정 유형 추가하기
        </button>

        {/* Bottom indicator */}
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-32 rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>,
    document.body
  );
}
