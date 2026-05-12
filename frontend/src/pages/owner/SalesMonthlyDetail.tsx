import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1, textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

export default function SalesMonthlyDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const year = searchParams.get("year") || "2025";
  const month = searchParams.get("month") || "10";

  const netSales: number = 8210200;
  const grossSales: number = 8908200;
  const discountAmount: number = 0;
  const refundAmount: number = 698000;

  const salesItems = [
    { label: '카드 매출', value: 6200000 },
    { label: '현금 매출', value: 1500000 },
    { label: '계좌이체', value: 400000 },
    { label: '상품권', value: 108200 },
  ];

  const cashOnHand: number = 1450000;
  const cashExpected: number = 1500000;
  const cashDifference: number = cashOnHand - cashExpected;

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 8px 8px' }}>
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>월간 매출 상세</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 날짜 */}
        <div style={{ padding: '16px 20px 12px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{year}년 {month}월</p>
          <p style={{ fontSize: '13px', color: '#9EA3AD', marginTop: '4px' }}>*{month}/01 ~ {month}/21 기준</p>
        </div>

        {/* 순매출 카드 */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ backgroundColor: '#F0F7FF', borderRadius: '16px', padding: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, color: '#7488FE' }}>
              순 매출액
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B' }}>순 매출</p>
              <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF' }}>{netSales.toLocaleString()}원</span>
            </div>
            <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '12px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#70737B' }}>총 매출액</span>
              <span style={{ fontSize: '14px', color: '#70737B' }}>{grossSales.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        <Divider thick />

        {/* 영업 매출 */}
        <div style={{ padding: '16px 20px' }}>
          <SectionTitle>영업 매출</SectionTitle>
          {salesItems.map((item, i) => (
            <InfoRow key={i} label={item.label}>{item.value.toLocaleString()}원</InfoRow>
          ))}
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>합계</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#4261FF' }}>{salesItems.reduce((s, it) => s + it.value, 0).toLocaleString()}원</span>
          </div>
        </div>

        <Divider thick />

        {/* 할인 및 환불 내역 */}
        <div style={{ padding: '16px 20px' }}>
          <SectionTitle>할인 및 환불 내역</SectionTitle>
          <InfoRow label="할인 금액">
            <span style={{ color: discountAmount > 0 ? '#FF8F00' : '#AAB4BF' }}>
              {discountAmount === 0 ? '없음' : `-${discountAmount.toLocaleString()}원`}
            </span>
          </InfoRow>
          <InfoRow label="환불 금액">
            <span style={{ color: refundAmount > 0 ? '#FF3D3D' : '#AAB4BF' }}>
              {refundAmount === 0 ? '없음' : `-${refundAmount.toLocaleString()}원`}
            </span>
          </InfoRow>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>합계 공제</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: (discountAmount + refundAmount) > 0 ? '#FF3D3D' : '#AAB4BF' }}>
              -{(discountAmount + refundAmount).toLocaleString()}원
            </span>
          </div>
        </div>

        <Divider thick />

        {/* 현금 내역 */}
        <div style={{ padding: '16px 20px' }}>
          <SectionTitle>현금 내역</SectionTitle>
          <InfoRow label="현금 매출 예상">{cashExpected.toLocaleString()}원</InfoRow>
          <InfoRow label="실제 현금 시재">{cashOnHand.toLocaleString()}원</InfoRow>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>과부족</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: cashDifference === 0 ? '#10C97D' : cashDifference > 0 ? '#4261FF' : '#FF3D3D' }}>
              {cashDifference === 0 ? '정상' : `${cashDifference > 0 ? '+' : ''}${cashDifference.toLocaleString()}원`}
            </span>
          </div>
          {cashDifference !== 0 && (
            <p style={{ fontSize: '13px', color: cashDifference < 0 ? '#FF3D3D' : '#4261FF', marginTop: '6px', fontWeight: 500 }}>
              *현금이 {Math.abs(cashDifference).toLocaleString()}원 {cashDifference < 0 ? '부족해요' : '초과해요'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
