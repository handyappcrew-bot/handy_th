import { ChevronRight } from "lucide-react";
import { useNavToast } from "@/hooks/use-nav-toast";

interface SalaryStore {
  name: string;
  dateRange: string;
  amount: number;
  hours: string;
}

interface SalaryPreviewProps {
  userName: string;
  month: string;
  totalAmount: number;
  stores: SalaryStore[];
}

const SalaryPreview = ({ userName, month, totalAmount, stores }: SalaryPreviewProps) => {
  const { navigateTo } = useNavToast();
  return (
    <div className="px-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>{userName} 님의</p>
          <p style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>
            이번달 <span style={{ color: '#4261FF' }}>예상 급여</span>에요
          </p>
        </div>
        <button onClick={() => navigateTo("/employee/salary", "급여관리로 이동했어요", { showLoading: true, forceAll: true })} className="pressable flex items-center text-muted-foreground mb-0.5" style={{ fontSize: '14px' }}>
          더보기 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <button onClick={() => navigateTo("/employee/salary", "급여관리로 이동했어요", { showLoading: true, forceAll: true })} className="pressable w-full text-left rounded-2xl bg-card p-5" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Month label */}
        <p className="text-base font-semibold text-[hsl(var(--schedule-shift-text))]">₩ {month} 예상 급여</p>

        {/* Total amount + arrow */}
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[32px] font-semibold text-[hsl(var(--schedule-day))]">
            {totalAmount.toLocaleString()}원
          </p>
          <ChevronRight className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Store list */}
        <div className="mt-5">
          {stores.map((store) => (
            <div key={store.name} className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--role-badge))]" />
                  <span className="text-base font-medium text-[hsl(var(--schedule-shift-text))]">{store.name}</span>
                </div>
                <p className="mt-0.5 ml-3.5 text-xs font-medium text-[hsl(var(--schedule-date-range))]">{store.dateRange}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-[hsl(var(--schedule-shift-text))]">{store.amount.toLocaleString()}원</p>
                <p className="text-xs font-medium text-[hsl(var(--schedule-date-range))]">총 {store.hours} 근무</p>
              </div>
            </div>
          ))}
        </div>
      </button>
    </div>
  );
};

export default SalaryPreview;
