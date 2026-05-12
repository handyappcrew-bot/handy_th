import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface Payslip {
  id: number;
  year: number;
  month: number;
  name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string | null;
  work_days: number;
  actual_work_minutes: number;
  overtime_minutes: number;
  night_minutes: number;
  holiday_minutes: number;
  weekly_leave_minutes: number;
  base_pay: number;
  overtime_pay: number;
  night_pay: number;
  holiday_pay: number;
  weekly_leave_pay: number;
  other_allowance: number;
  income_tax: number;
  local_income_tax: number;
  national_pension: number;
  health_insurance: number;
  long_term_care: number;
  employment_insurance: number;
  total_pay: number;
  total_deduction: number;
  net_pay: number;
  hourly_rate: number | null;
}

const minToHourStr = (min: number) => {
  if (!min) return "0분";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};

const SectionDivider = () => <div className="h-2 bg-[#F7F7F8]" />;

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className={`text-[15px] ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>
      {label}
    </span>
    <span className={`text-[15px] ${bold ? "font-bold text-foreground" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

const PayStubDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storeId = localStorage.getItem("currentStoreId");
    if (!storeId || !id) return;

    fetch(`/api/employee/payslips/${id}?store_id=${storeId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setPayslip(data);
        setLoading(false);
        if (data) {
          const viewed: string[] = JSON.parse(localStorage.getItem("viewedPayslips") || "[]");
          if (!viewed.includes(String(id))) {
            viewed.push(String(id));
            localStorage.setItem("viewedPayslips", JSON.stringify(viewed));
          }
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-white flex items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-white flex items-center justify-center">
        <p className="text-muted-foreground">급여명세서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const hasSocialInsurance = (payslip.national_pension ?? 0) > 0;
  const periodStart = payslip.pay_period_start?.replace(/-/g, '.') || '-';
  const periodEnd = payslip.pay_period_end?.replace(/-/g, '.') || '-';
  const totalWorkMin = (payslip.actual_work_minutes ?? 0) + (payslip.overtime_minutes ?? 0) + (payslip.night_minutes ?? 0) + (payslip.holiday_minutes ?? 0);
  const totalPayMin = totalWorkMin + (payslip.weekly_leave_minutes ?? 0);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate("/employee/salary")} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여명세서</h1>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-lg font-bold text-foreground">
          {payslip.year}년 {payslip.month}월{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({periodStart} - {periodEnd})
          </span>
        </p>
        <p className="text-lg font-bold text-foreground mt-0.5">
          {payslip.name}님의 급여명세서
        </p>
        <div className="mt-4 text-right">
          <p className="text-xs text-primary">실 지급액</p>
          <p className="text-2xl font-bold text-primary">
            {(payslip.net_pay ?? 0).toLocaleString()}원
          </p>
        </div>
      </div>

      <SectionDivider />

      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">근무 내역</h2>
        <div className="space-y-2.5">
          <Row label="근로일수" value={`${payslip.work_days ?? 0}일`} />
          <Row label="실근로시간" value={minToHourStr(totalWorkMin)} />
          <Row label="주휴수당시간" value={minToHourStr(payslip.weekly_leave_minutes ?? 0)} />
          <Row label="총 지급시간" value={minToHourStr(totalPayMin)} bold />
        </div>
      </div>

      <SectionDivider />

      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">지급 내역</h2>
        <div className="space-y-2.5">
          <Row label="기본급" value={`${(payslip.base_pay ?? 0).toLocaleString()}원`} />
          {(payslip.overtime_pay ?? 0) > 0 && (
            <Row label="연장수당" value={`${payslip.overtime_pay.toLocaleString()}원`} />
          )}
          {(payslip.night_pay ?? 0) > 0 && (
            <Row label="야간수당" value={`${payslip.night_pay.toLocaleString()}원`} />
          )}
          {(payslip.holiday_pay ?? 0) > 0 && (
            <Row label="휴일수당" value={`${payslip.holiday_pay.toLocaleString()}원`} />
          )}
          {(payslip.weekly_leave_pay ?? 0) > 0 && (
            <Row label="주휴수당" value={`${payslip.weekly_leave_pay.toLocaleString()}원`} />
          )}
          {(payslip.other_allowance ?? 0) > 0 && (
            <Row label="기타수당" value={`${payslip.other_allowance.toLocaleString()}원`} />
          )}
          <Row label="지급 합계" value={`${(payslip.total_pay ?? 0).toLocaleString()}원`} bold />
        </div>
      </div>

      <SectionDivider />

      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">공제 내역</h2>
        <div className="space-y-2.5">
          <Row label="소득세" value={`${(payslip.income_tax ?? 0).toLocaleString()}원`} />
          <Row label="지방소득세" value={`${(payslip.local_income_tax ?? 0).toLocaleString()}원`} />
          {hasSocialInsurance && (
            <>
              <Row label="국민연금" value={`${(payslip.national_pension ?? 0).toLocaleString()}원`} />
              <Row label="건강보험" value={`${(payslip.health_insurance ?? 0).toLocaleString()}원`} />
              <Row label="장기요양보험" value={`${(payslip.long_term_care ?? 0).toLocaleString()}원`} />
              <Row label="고용보험" value={`${(payslip.employment_insurance ?? 0).toLocaleString()}원`} />
            </>
          )}
          <Row label="총 공제액" value={`${(payslip.total_deduction ?? 0).toLocaleString()}원`} bold />
        </div>
      </div>

      {!hasSocialInsurance && (
        <>
          <SectionDivider />
          <div className="bg-[#F7F7F8] px-5 py-5">
            <p className="text-xs leading-relaxed text-primary">
              본 급여명세서는 주당 소정근로시간이 15시간 미만이거나
              법정 4대보험 적용 대상에 해당하지 않는 근로자에
              대한 급여 내역으로, 국민연금, 건강보험, 장기요양보험,
              고용보험은 공제되지 않았으며, 근로소득세 및 지방소득세만
              공제되었습니다.
            </p>
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  );
};

export default PayStubDetail;
