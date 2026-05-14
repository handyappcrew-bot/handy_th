import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalesDailyEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const dateParam = searchParams.get("date") ?? "";
  const dateLabel = dateParam || "2024년 7월 5일 (금)";

  // 직원 마감보고 입력값 기준 (Mock - 백엔드 연동 시 GET API로 교체)
  const [cardSales, setCardSales] = useState("200000");
  const [cashSales, setCashSales] = useState("200000");
  const [transferSales, setTransferSales] = useState("0");
  const [voucherSales, setVoucherSales] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [refundAmount, setRefundAmount] = useState("0");
  const [cashOnHand, setCashOnHand] = useState("50000");
  const [cashDiffType, setCashDiffType] = useState("");
  const [cashDiffAmount, setCashDiffAmount] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [additionalMessage, setAdditionalMessage] = useState("");

  const handleSave = () => {
    toast({ description: "매출이 수정되었어요.", duration: 2000 });
    navigate(-1);
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>매출 수정</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 날짜 */}
        <div style={{ padding: '16px 20px 12px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{dateLabel}</p>
        </div>

        {/* 매출 금액 */}
        <Section title="매출 금액">
          <InputRow label="카드 매출 금액" value={cardSales} onChange={setCardSales} suffix="원" />
          <InputRow label="현금 매출 금액" value={cashSales} onChange={setCashSales} suffix="원" />
          <InputRow label="계좌 이체 금액" value={transferSales} onChange={setTransferSales} suffix="원" />
          <InputRow label="상품권 매출 금액" value={voucherSales} onChange={setVoucherSales} suffix="원" />
        </Section>

        <Divider />

        {/* 차감 항목 */}
        <Section title="차감 항목">
          <InputRow label="할인 금액" value={discountAmount} onChange={setDiscountAmount} suffix="원" />
          <InputRow label="환불 금액" value={refundAmount} onChange={setRefundAmount} suffix="원" />
        </Section>

        <Divider />

        {/* 현금 시재 */}
        <Section title="현금 시재">
          <InputRow label="실제 현금 시재" value={cashOnHand} onChange={setCashOnHand} suffix="원" />
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#70737B', flexShrink: 0 }}>시재 차이</span>
            <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
              <select
                value={cashDiffType}
                onChange={(e) => setCashDiffType(e.target.value)}
                style={{ height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #DBDCDF', backgroundColor: '#FFFFFF', fontSize: '14px', color: cashDiffType ? '#19191B' : '#9EA3AD', outline: 'none' }}
              >
                <option value="">선택</option>
                <option value="초과">초과</option>
                <option value="부족">부족</option>
              </select>
              <input
                type="text"
                inputMode="numeric"
                value={cashDiffAmount ? Number(cashDiffAmount).toLocaleString() : ''}
                onChange={(e) => setCashDiffAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                style={{ width: '100px', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #DBDCDF', backgroundColor: '#FFFFFF', fontSize: '15px', fontWeight: 600, color: '#19191B', textAlign: 'right', outline: 'none', boxShadow: 'none' }}
                className="focus:border-primary"
              />
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#19191B', alignSelf: 'center' }}>원</span>
            </div>
          </div>
        </Section>

        <Divider />

        {/* 마감 영수증 */}
        <Section title="마감 영수증 이미지">
          <div style={{ padding: '0 20px' }}>
            {receiptImage ? (
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={receiptImage} alt="영수증" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  className="pressable"
                  onClick={() => setReceiptImage(null)}
                  style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {/* TODO: image upload */ }}
                className="pressable"
                style={{ width: '120px', height: '120px', borderRadius: '12px', backgroundColor: '#F7F7F8', border: '1px dashed #DBDCDF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <Camera className="w-6 h-6" style={{ color: '#9EA3AD' }} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>영수증 등록</span>
              </button>
            )}
          </div>
        </Section>

        <Divider />

        {/* 추가 전달 사항 */}
        <Section title="추가 전달 사항">
          <div style={{ padding: '0 20px' }}>
            <textarea
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="특이사항을 입력해주세요"
              maxLength={300}
              style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #DBDCDF', backgroundColor: '#FFFFFF', fontSize: '14px', resize: 'none', outline: 'none', boxShadow: 'none', fontFamily: 'inherit' }}
              className="focus:border-primary"
            />
          </div>
        </Section>
      </div>

      {createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderTop: '1px solid #F7F7F8' }}>
          <div style={{ maxWidth: '512px', margin: '0 auto', padding: '16px 20px', display: 'flex', gap: '8px' }}>
            <button className="pressable" onClick={() => navigate(-1)} style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer' }}>취소</button>
            <button className="pressable" onClick={handleSave} style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>수정하기</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <h2 style={{ padding: '0 20px', fontSize: '16px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '8px', backgroundColor: '#F7F7F8' }} />;
}

function InputRow({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '15px', fontWeight: 500, color: '#70737B', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
        <input
          type="text"
          inputMode="numeric"
          value={value ? Number(value).toLocaleString() : ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            onChange(raw);
          }}
          placeholder="0"
          style={{ width: '140px', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #DBDCDF', backgroundColor: '#FFFFFF', fontSize: '15px', fontWeight: 600, color: '#19191B', textAlign: 'right', outline: 'none', boxShadow: 'none' }}
          className="focus:border-primary"
        />
        {suffix && <span style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{suffix}</span>}
      </div>
    </div>
  );
}