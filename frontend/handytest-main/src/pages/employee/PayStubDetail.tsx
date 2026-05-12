import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PayStubData {
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  userName: string;
  netPay: number;
  hasSocialInsurance: boolean;
  work: {
    workDays: number;
    actualHours: number;
    weeklyHolidayHours: number;
    weeklyHolidayCalc: string;
    totalPayHours: number;
  };
  payment: {
    basePay: number;
    basePayHours: number;
    weeklyHolidayPay: number;
    weeklyHolidayPayHours: number;
    incentive: number;
    totalPayment: number;
  };
  deduction: {
    incomeTax: number;
    incomeTaxNote: string;
    localIncomeTax: number;
    localIncomeTaxNote: string;
    nationalPension?: number;
    nationalPensionNote?: string;
    healthInsurance?: number;
    healthInsuranceNote?: string;
    longTermCare?: number;
    longTermCareNote?: string;
    employmentInsurance?: number;
    employmentInsuranceNote?: string;
    totalDeduction: number;
  };
  comment: string;
}

const MOCK_STUBS: Record<string, PayStubData> = {
  "1": {
    year: 2025,
    month: 10,
    periodStart: "2025.10.01",
    periodEnd: "2025.10.31",
    userName: "김정민",
    netPay: 1924612,
    hasSocialInsurance: false,
    work: {
      workDays: 23,
      actualHours: 147,
      weeklyHolidayHours: 29,
      weeklyHolidayCalc: "1일 평균 근로시간 5.8 × 5주",
      totalPayHours: 29,
    },
    payment: {
      basePay: 1778000,
      basePayHours: 147,
      weeklyHolidayPay: 349000,
      weeklyHolidayPayHours: 29,
      incentive: 0,
      totalPayment: 2127360,
    },
    deduction: {
      incomeTax: 6055,
      incomeTaxNote: "근로자 부담 3%",
      localIncomeTax: 255,
      localIncomeTaxNote: "근로자 부담 0.3%",
      totalDeduction: 6310,
    },
    comment: "이번달도 고생 많으셨습니다. 감사합니다.",
  },
  "3": {
    year: 2025,
    month: 10,
    periodStart: "2025.10.01",
    periodEnd: "2025.10.31",
    userName: "김정민",
    netPay: 1924612,
    hasSocialInsurance: false,
    work: {
      workDays: 23,
      actualHours: 147,
      weeklyHolidayHours: 29,
      weeklyHolidayCalc: "1일 평균 근로시간 5.8 × 5주",
      totalPayHours: 29,
    },
    payment: {
      basePay: 1778000,
      basePayHours: 147,
      weeklyHolidayPay: 349000,
      weeklyHolidayPayHours: 29,
      incentive: 0,
      totalPayment: 2127360,
    },
    deduction: {
      incomeTax: 6055,
      incomeTaxNote: "근로자 부담 3%",
      localIncomeTax: 255,
      localIncomeTaxNote: "근로자 부담 0.3%",
      totalDeduction: 6310,
    },
    comment: "이번달도 고생 많으셨습니다. 감사합니다.",
  },
  "2": {
    year: 2025,
    month: 10,
    periodStart: "2025.10.01",
    periodEnd: "2025.10.31",
    userName: "김정민",
    netPay: 1924612,
    hasSocialInsurance: true,
    work: {
      workDays: 23,
      actualHours: 147,
      weeklyHolidayHours: 29,
      weeklyHolidayCalc: "1일 평균 근로시간 5.8 × 5주",
      totalPayHours: 29,
    },
    payment: {
      basePay: 1778000,
      basePayHours: 147,
      weeklyHolidayPay: 349000,
      weeklyHolidayPayHours: 29,
      incentive: 0,
      totalPayment: 2127360,
    },
    deduction: {
      incomeTax: 2430,
      incomeTaxNote: "약 0.5~1.5%",
      localIncomeTax: 243,
      localIncomeTaxNote: "소득세의 10%",
      nationalPension: 95731,
      nationalPensionNote: "근로자 부담 4.5%",
      healthInsurance: 75436,
      healthInsuranceNote: "근로자 부담 3.545%",
      longTermCare: 9762,
      longTermCareNote: "건강보험료의 12.81%",
      employmentInsurance: 928,
      employmentInsuranceNote: "근로자 부담 0.9%",
      totalDeduction: 202748,
    },
    comment: "이번달도 고생 많으셨습니다. 감사합니다.",
  },
  "4": {
    year: 2025,
    month: 10,
    periodStart: "2025.10.01",
    periodEnd: "2025.10.31",
    userName: "김정민",
    netPay: 1924612,
    hasSocialInsurance: true,
    work: {
      workDays: 23,
      actualHours: 147,
      weeklyHolidayHours: 29,
      weeklyHolidayCalc: "1일 평균 근로시간 5.8 × 5주",
      totalPayHours: 29,
    },
    payment: {
      basePay: 1778000,
      basePayHours: 147,
      weeklyHolidayPay: 349000,
      weeklyHolidayPayHours: 29,
      incentive: 0,
      totalPayment: 2127360,
    },
    deduction: {
      incomeTax: 2430,
      incomeTaxNote: "약 0.5~1.5%",
      localIncomeTax: 243,
      localIncomeTaxNote: "소득세의 10%",
      nationalPension: 95731,
      nationalPensionNote: "근로자 부담 4.5%",
      healthInsurance: 75436,
      healthInsuranceNote: "근로자 부담 3.545%",
      longTermCare: 9762,
      longTermCareNote: "건강보험료의 12.81%",
      employmentInsurance: 928,
      employmentInsuranceNote: "근로자 부담 0.9%",
      totalDeduction: 202748,
    },
    comment: "이번달도 고생 많으셨습니다. 감사합니다.",
  },
};

const SectionDivider = () => <div className="h-2 bg-[#F7F7F8]" />;

const PayStubDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const stub = MOCK_STUBS[id || "1"];

  if (!stub) {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-white flex items-center justify-center">
        <p className="text-muted-foreground">급여명세서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate("/salary")} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{fontSize:'20px',fontWeight:700,letterSpacing:'-0.02em',color:'#19191B'}}>급여명세서</h1>
      </div>

      {/* Title section */}
      <div className="px-5 pt-4 pb-5">
        <p className="text-lg font-bold text-foreground">
          {stub.year}년 {stub.month}월{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({stub.periodStart} - {stub.periodEnd})
          </span>
        </p>
        <p className="text-lg font-bold text-foreground mt-0.5">
          {stub.userName}님의 급여명세서
        </p>
        <div className="mt-4 text-right">
          <p className="text-xs text-primary">실 지급액</p>
          <p className="text-2xl font-bold text-primary">
            {stub.netPay.toLocaleString()}원
          </p>
        </div>
      </div>

      <SectionDivider />

      {/* 근무 내역 */}
      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">근무 내역</h2>
        <div className="space-y-2.5">
          <Row label="근로일수" value={`${stub.work.workDays}일`} />
          <Row label="실근로시간" value={`${stub.work.actualHours}시간`} />
          <div>
            <Row label="주휴수당시간" value={`${stub.work.weeklyHolidayHours}시간`} />
            <p className="ml-[100px] text-xs text-muted-foreground mt-0.5">
              ({stub.work.weeklyHolidayCalc})
            </p>
          </div>
          <Row label="총 지급시간" value={`${stub.work.totalPayHours}시간`} />
        </div>
      </div>

      <SectionDivider />

      {/* 지급 내역 */}
      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">지급 내역</h2>
        <div className="space-y-2.5">
          <Row
            label="기본급"
            value={`${stub.payment.basePay.toLocaleString()}원`}
            sub={`(${stub.payment.basePayHours}시간)`}
          />
          <Row
            label="주휴수당"
            value={`${stub.payment.weeklyHolidayPay.toLocaleString()}원`}
            sub={`(${stub.payment.weeklyHolidayPayHours}시간)`}
          />
          <Row
            label="기타 수당"
            labelSub="(인센티브)"
            value={`${stub.payment.incentive.toLocaleString()}원`}
          />
          <Row
            label="지급앱 합계"
            value={`${stub.payment.totalPayment.toLocaleString()}원`}
            bold
          />
        </div>
      </div>

      <SectionDivider />

      {/* 공제 내역 */}
      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-4">공제 내역</h2>
        <div className="space-y-2.5">
          <Row
            label="소득세"
            value={`${stub.deduction.incomeTax.toLocaleString()}원`}
            sub={`(${stub.deduction.incomeTaxNote})`}
          />
          <Row
            label="지방소득세"
            value={`${stub.deduction.localIncomeTax.toLocaleString()}원`}
            sub={`(${stub.deduction.localIncomeTaxNote})`}
          />
          {stub.hasSocialInsurance && (
            <>
              <Row
                label="국민연금"
                value={`${stub.deduction.nationalPension?.toLocaleString()}원`}
                sub={`(${stub.deduction.nationalPensionNote})`}
              />
              <Row
                label="건강보험"
                value={`${stub.deduction.healthInsurance?.toLocaleString()}원`}
                sub={`(${stub.deduction.healthInsuranceNote})`}
              />
              <Row
                label="장기요양보험"
                value={`${stub.deduction.longTermCare?.toLocaleString()}원`}
                sub={`(${stub.deduction.longTermCareNote})`}
              />
              <Row
                label="고용보험"
                value={`${stub.deduction.employmentInsurance?.toLocaleString()}원`}
                sub={`(${stub.deduction.employmentInsuranceNote})`}
              />
            </>
          )}
          <Row
            label="총 공제액"
            value={`${stub.deduction.totalDeduction.toLocaleString()}원`}
            bold
          />
        </div>
      </div>

      <SectionDivider />

      {/* 전달 코멘트 */}
      <div className="px-5 py-5">
        <h2 className="text-lg font-bold text-foreground mb-3">전달 코멘트</h2>
        <p className="text-[15px] text-foreground">{stub.comment}</p>
      </div>

      {/* 하단 안내문 */}
      {!stub.hasSocialInsurance && (
        <div className="bg-[#F7F7F8] px-5 py-5">
          <p className="text-xs leading-relaxed text-primary">
            본 급여명세서는 주당 소정근로시간이 15시간 미만이거나
            법정 4대보험 적용 대상에 해당하지 않는 근로자에
            대한 급여 내역으로, 국민연금, 건강보험, 장기요양보험,
            고용보험은 공제되지 않았으며, 근로소득세 및 지방소득세만
            공제되었습니다.
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
};

const Row = ({
  label,
  labelSub,
  value,
  sub,
  bold,
}: {
  label: string;
  labelSub?: string;
  value: string;
  sub?: string;
  bold?: boolean;
}) => (
  <div className="flex items-start">
    <div className="w-[100px] shrink-0">
      <span className={`text-[15px] ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      {labelSub && (
        <span className="block text-xs text-muted-foreground">{labelSub}</span>
      )}
    </div>
    <div>
      <span className={`text-[15px] ${bold ? "font-bold text-foreground" : "text-foreground"}`}>
        {value}
      </span>
      {sub && (
        <span className="text-xs text-muted-foreground ml-0.5">{sub}</span>
      )}
    </div>
  </div>
);

export default PayStubDetail;
