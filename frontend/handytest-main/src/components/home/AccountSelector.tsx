import { X, Check, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { setRoleLabel } from "@/utils/function";

export interface AccountType {
  id: string;
  storeId: number;
  storeName: string;
  role: string;
  employeeType: string;
}

interface AccountSelectorProps {
  open: boolean;
  accounts: AccountType[];
  selectedId: string;
  onSelect: (account: AccountType) => void;
  onClose: () => void;
}

const AccountSelector = ({ open, accounts, selectedId, onSelect, onClose }: AccountSelectorProps) => {
  const navigate = useNavigate();
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card px-5 pb-8 pt-6 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">계정 유형 선택</h2>
          <button onClick={onClose} className="pressable">
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
                onClick={() => onSelect(account)}
                className={`pressable flex items-center justify-between rounded-xl px-4 py-4 text-left transition-colors ${isSelected ? "bg-[hsl(var(--notice-card-bg))]" : ""
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-foreground">{account.storeName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isSelected
                      ? "bg-[hsl(var(--role-badge))] text-white"
                      : "bg-muted text-muted-foreground"
                    }`}>
                    {setRoleLabel(account.role)}
                  </span>
                </div>
                {isSelected && <Check className="h-5 w-5 text-[hsl(var(--role-badge))]" />}
              </button>
            );
          })}
        </div>

        {/* Add account */}
        <button className="pressable mt-4 flex items-center gap-1.5 px-4 py-3 text-base font-medium text-foreground" onClick={() => { onClose(); navigate("/onboarding/member-type"); }}>
          <Plus className="h-5 w-5" />
          계정 유형 추가하기
        </button>

        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
    , document.body);
};

export default AccountSelector;
