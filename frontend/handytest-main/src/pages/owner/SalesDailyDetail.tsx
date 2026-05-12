import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, X, Pencil } from "lucide-react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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

export default function SalesDailyDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateStr = searchParams.get("date") || "2025-10-02";
  const [receiptOpen, setReceiptOpen] = useState(false);

  const date = new Date(dateStr);
  const dateLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_LABELS[date.getDay()]})`;

  const grossSales: number = 420000;
  const discountAmount: number = 15000;
  const refundAmount: number = 0;
  const netSales: number = grossSales - discountAmount - refundAmount;
  const closingStaff: string = "김정민";

  const salesItems = [
    { label: '카드 매출', value: 200000 },
    { label: '현금 매출', value: 200000 },
    { label: '계좌이체', value: 10000 },
    { label: '상품권', value: 10000 },
  ];

  const cashOnHand: number = 50000;
  const cashExpected: number = 200000;
  const cashDifference: number = cashOnHand - cashExpected;
  const note: string = "현금 과부족이 3만원 발생했습니다.";
  const receiptImgUrl: string | null = null;

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center justify-between gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="pressable p-1">
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>매출 상세</h1>
            </div>
            <button onClick={() => navigate(`/owner/sales/daily-edit?date=${searchParams.get("date") ?? ""}`)} className="pressable p-2">
              <Pencil className="h-5 w-5" style={{ color: '#4261FF' }} />
            </button>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 날짜 + 담당자 */}
        <div style={{ padding: '16px 20px 12px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '8px' }}>{dateLabel}</p>
          <InfoRow label="마감 담당자">{closingStaff}</InfoRow>
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

        <Divider thick />

        {/* 마감 영수증 */}
        <div style={{ padding: '16px 20px' }}>
          <SectionTitle>마감 영수증</SectionTitle>
          {receiptImgUrl ? (
            <button onClick={() => setReceiptOpen(true)} className="pressable" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
              <img src={receiptImgUrl} alt="마감 영수증" style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '10px' }} />
            </button>
          ) : (
            <button onClick={() => setReceiptOpen(true)} className="pressable"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '140px', backgroundColor: '#F7F7F8', borderRadius: '10px', border: '1px dashed #DBDCDF', cursor: 'pointer', gap: '6px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DBDCDF" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#AAB4BF', fontWeight: 500 }}>영수증 보기</span>
            </button>
          )}
        </div>

        <Divider thick />

        {/* 전달 사항 */}
        <div style={{ padding: '16px 20px' }}>
          <SectionTitle>전달 사항</SectionTitle>
          <p style={{ fontSize: '16px', fontWeight: 500, color: '#19191B', lineHeight: '1.6' }}>{note}</p>
        </div>

      </div>

      {/* 영수증 이미지 팝업 */}
      {receiptOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 touch-none" onClick={() => setReceiptOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '420px', backgroundColor: '#FFFFFF', borderRadius: '20px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>마감 영수증</span>
              <button className="pressable" onClick={() => setReceiptOpen(false)}>
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F8', minHeight: '260px' }}>
              {receiptImgUrl ? (
                <img src={receiptImgUrl} alt="마감 영수증" style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#DBDCDF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9EA3AD" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '14px', color: '#9EA3AD', textAlign: 'center', lineHeight: '1.5' }}>영수증 이미지가<br />아직 등록되지 않았어요</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}