import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ChangeTag({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
      <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{from}원</span>
      <span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span>
      <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{to}원으로 수정</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

function SubSectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '16px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '10px', marginTop: '4px' }}>{children}</p>;
}

function InfoRow({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1 }}>{children}</span>
    </div>
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

export default function PayslipPublish() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const staffName = searchParams.get("name") || "김정민";
  const isModified = searchParams.get("modified") === "true";
  const changesRaw = searchParams.get("changes");
  const changes: Record<string, { label: string; from: string; to: string }> = changesRaw ? (() => { try { return JSON.parse(decodeURIComponent(changesRaw)); } catch { return {}; } })() : {};

  const parseAmt = (s: string) => parseInt(s.replace(/,/g, ''), 10) || 0;
  const fmt = (n: number) => n.toLocaleString();

  const BASE = {
    basePay: "1,617,000", overtimePay: "88,000", nightPay: "44,000",
    holidayPay: "55,000",
    weeklyAllowance: "319,000", otherAllowance: "0",
    incomeTax: "2,430", localTax: "243", nationalPension: "95,731",
    healthInsurance: "75,436", longTermCare: "9,762", employmentInsurance: "928",
  };
  const get = (key: keyof typeof BASE) => changes[key]?.to ?? BASE[key];

  const basePay = get("basePay");
  const overtimePay = get("overtimePay");
  const nightPay = get("nightPay");
  const holidayPay = get("holidayPay");
  const weeklyAllow = get("weeklyAllowance");
  const otherAllow = get("otherAllowance");
  const incomeTaxVal = get("incomeTax");
  const localTaxVal = get("localTax");
  const pensionVal = get("nationalPension");
  const healthVal = get("healthInsurance");
  const ltcVal = get("longTermCare");
  const employVal = get("employmentInsurance");

  const totalPayNum = parseAmt(basePay) + parseAmt(overtimePay) + parseAmt(nightPay) + parseAmt(holidayPay) + parseAmt(weeklyAllow) + parseAmt(otherAllow);
  const incomeTaxTotalNum = parseAmt(incomeTaxVal) + parseAmt(localTaxVal);
  const socialTotalNum = parseAmt(pensionVal) + parseAmt(healthVal) + parseAmt(ltcVal) + parseAmt(employVal);
  const totalDeductionNum = incomeTaxTotalNum + socialTotalNum;
  const netSalaryNum = totalPayNum - totalDeductionNum;

  const [isPublished, setIsPublished] = useState(searchParams.get("published") === "true");
  const from = searchParams.get("from");
  const transferKey = `payslip_transferred_2025_10_${staffName}`;
  const [isTransferred, setIsTransferred] = useState(() => !!localStorage.getItem(transferKey));
  const [sendSheetOpen, setSendSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [comment, setComment] = useState("");
  // ① 발행 시 저장된 코멘트
  const [publishedComment, setPublishedComment] = useState("");

  const handleSend = () => {
    setSendSheetOpen(false);
    setIsPublished(true);
    setPublishedComment(comment);
    localStorage.setItem(`payslip_published_${staffName}`, new Date().toISOString());
    toast({ description: "급여명세서가 발급되었어요.", duration: 3000 });
  };

  const publishedAtRaw = localStorage.getItem(`payslip_published_${staffName}`);
  const formatPublishedAt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleTransferConfirm = () => {
    setTransferConfirmOpen(false);
    setIsTransferred(true);
    localStorage.setItem(`payslip_transferred_${staffName}`, new Date().toISOString());
    toast({ description: "이체 완료로 기록되었어요.", duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ minHeight: '100dvh' }}>
      <div className="pb-32">

        {/* Header — ② 발행 여부에 따라 타이틀 분기 */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => isPublished
              ? (from === 'detail'
                ? navigate(`/owner/salary?staff=${encodeURIComponent(staffName)}`, { replace: true })
                : navigate('/owner/salary?tab=payslip', { replace: true }))  // /salary → /owner/salary
              : navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
              {isPublished ? '급여명세서 상세' : '급여명세서 미리보기'}
            </h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 발행 시각 안내 배너 */}
        {isPublished && publishedAtRaw && (
          <div style={{ padding: '10px 20px', backgroundColor: '#F7F8FF', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '13px', color: '#7488FE' }}>
              {formatPublishedAt(publishedAtRaw)}에 발급된 급여명세서예요
            </span>
          </div>
        )}

        {/* 미발급 안내 배너 */}
        {!isPublished && (
          <div style={{ padding: '10px 20px', backgroundColor: '#F7F8FF', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '13px', color: '#7488FE' }}>
              급여명세서를 확인 후 발급해주세요
            </span>
          </div>
        )}

        {/* 이체 확인 배너 — 발행 후 & 이체 미완료 시만 노출 */}
        {isPublished && !isTransferred && (
          <div style={{ padding: '12px 20px', backgroundColor: '#FFF8E1', borderBottom: '1px solid #FFE082', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>💸</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#92400E', lineHeight: '1.5' }}>급여 이체 후 이체 확인 버튼을<br />눌러주세요</span>
            </div>
            <button
              onClick={() => setTransferConfirmOpen(true)}
              style={{ flexShrink: 0, height: '34px', padding: '0 14px', borderRadius: '8px', border: 'none', backgroundColor: '#FFB300', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              이체 확인
            </button>
          </div>
        )}

        {/* 타이틀 */}
        <div style={{ padding: '20px 20px 16px', backgroundColor: '#FFFFFF' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#19191B' }}>2025년 10월</span>
              <span style={{ fontSize: '13px', color: '#9EA3AD' }}>(2025.10.01 - 2025.10.31)</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#19191B', margin: 0 }}>{staffName}님의 급여명세서</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: '#9EA3AD' }}>실지급액</span>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em', margin: '2px 0' }}>{fmt(netSalaryNum)}원</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9EA3AD' }}>지급 {fmt(totalPayNum)}원</span>
              <span style={{ fontSize: '12px', color: '#9EA3AD' }}>-</span>
              <span style={{ fontSize: '12px', color: '#9EA3AD' }}>공제 {fmt(totalDeductionNum)}원</span>
            </div>
          </div>
        </div>

        <Divider thick />

        {/* 근무 내역 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>근무 내역</SectionTitle>
          <InfoRow label="근로일수">23일</InfoRow>
          <InfoRow label="실근로시간">147시간</InfoRow>
          <InfoRow label="연장근로시간">8시간</InfoRow>
          <InfoRow label="야간근로시간">4시간</InfoRow>
          <InfoRow label="휴일근로시간">4시간 30분</InfoRow>
          <InfoRow label="주휴수당시간">
            <div>
              <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>29시간</span>
              <br />
              <span style={{ fontSize: '12px', color: '#9EA3AD' }}>(1일 평균 근로시간 5.8 × 5주)</span>
            </div>
          </InfoRow>
          <InfoRow label="총 지급시간">188시간</InfoRow>
        </div>

        <Divider thick />

        {/* 지급 내역 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>지급 내역</SectionTitle>
          <InfoRow label="기본급">
            <div>
              {basePay}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(147시간)</span>
              {changes.basePay && <ChangeTag from={changes.basePay.from} to={changes.basePay.to} />}
            </div>
          </InfoRow>
          <InfoRow label="연장수당">
            <div>
              {overtimePay}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(8시간)</span>
              <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 1.5배 (법정 기준)</span>
              {changes.overtimePay && <ChangeTag from={changes.overtimePay.from} to={changes.overtimePay.to} />}
            </div>
          </InfoRow>
          <InfoRow label="야간수당">
            <div>
              {nightPay}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(4시간)</span>
              <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 0.5배 추가 (법정 기준)</span>
              {changes.nightPay && <ChangeTag from={changes.nightPay.from} to={changes.nightPay.to} />}
            </div>
          </InfoRow>
          <InfoRow label="휴일수당">
            <div>
              {holidayPay}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(4시간 30분)</span>
              <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 1.5배 (8시간 이내, 법정 기준)</span>
              {changes.holidayPay && <ChangeTag from={changes.holidayPay.from} to={changes.holidayPay.to} />}
            </div>
          </InfoRow>
          <InfoRow label="주휴수당">
            <div>
              {weeklyAllow}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(29시간)</span>
              <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>1일 평균 근로시간 5.8 × 5주 (주 15시간 이상 기준)</span>
              {changes.weeklyAllowance && <ChangeTag from={changes.weeklyAllowance.from} to={changes.weeklyAllowance.to} />}
            </div>
          </InfoRow>
          <InfoRow label={<>기타 수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>(인센티브)</span></>}>
            <div>
              {otherAllow}원
              {changes.otherAllowance && <ChangeTag from={changes.otherAllowance.from} to={changes.otherAllowance.to} />}
            </div>
          </InfoRow>
          <InfoRow label="지급액 합계"><span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{fmt(totalPayNum)}원</span></InfoRow>
        </div>

        <Divider thick />

        {/* 공제 내역 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>공제 내역</SectionTitle>

          <SubSectionTitle>소득세</SubSectionTitle>
          <div>
            <InfoRow label="소득세">
              <div>
                {incomeTaxVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(근로자 부담 3%)</span>
                {changes.incomeTax && <ChangeTag from={changes.incomeTax.from} to={changes.incomeTax.to} />}
              </div>
            </InfoRow>
            <InfoRow label="지방소득세">
              <div>
                {localTaxVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(소득세의 10%)</span>
                {changes.localTax && <ChangeTag from={changes.localTax.from} to={changes.localTax.to} />}
              </div>
            </InfoRow>
          </div>
          <InfoRow label="소득세 합계"><span style={{ fontWeight: 600 }}>{fmt(incomeTaxTotalNum)}원</span></InfoRow>

          <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '4px 0 12px' }} />

          <SubSectionTitle>4대 보험</SubSectionTitle>
          <div>
            <InfoRow label="국민연금">
              <div>
                {pensionVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(근로자 부담 4.5%)</span>
                {changes.nationalPension && <ChangeTag from={changes.nationalPension.from} to={changes.nationalPension.to} />}
              </div>
            </InfoRow>
            <InfoRow label="건강보험">
              <div>
                {healthVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(근로자 부담 3.545%)</span>
                {changes.healthInsurance && <ChangeTag from={changes.healthInsurance.from} to={changes.healthInsurance.to} />}
              </div>
            </InfoRow>
            <InfoRow label="장기요양보험">
              <div>
                {ltcVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(건강보험료의 12.81%)</span>
                {changes.longTermCare && <ChangeTag from={changes.longTermCare.from} to={changes.longTermCare.to} />}
              </div>
            </InfoRow>
            <InfoRow label="고용보험">
              <div>
                {employVal}원<span style={{ fontSize: '13px', color: '#9EA3AD' }}>(근로자 부담 0.9%)</span>
                {changes.employmentInsurance && <ChangeTag from={changes.employmentInsurance.from} to={changes.employmentInsurance.to} />}
              </div>
            </InfoRow>
          </div>
          <InfoRow label="4대보험 합계"><span style={{ fontWeight: 600 }}>{fmt(socialTotalNum)}원</span></InfoRow>

          <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '4px 0 12px' }} />

          <InfoRow label="총 공제액"><span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{fmt(totalDeductionNum)}원</span></InfoRow>
        </div>

        <Divider thick />

        {/* ① 코멘트 영역 — 발행 후 코멘트 있을 때만 노출 */}
        {isPublished && publishedComment.trim() && (
          <>
            <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#70737B', marginBottom: '8px' }}>전달 코멘트</p>
              <p style={{ fontSize: '15px', color: '#19191B', lineHeight: '1.6' }}>{publishedComment}</p>
            </div>
            <Divider thick />
          </>
        )}

        {/* 이체 완료 체크 */}
        {isPublished && (
          <>
            <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#19191B', marginBottom: '2px' }}>실제 이체 완료 여부</p>
                  <p style={{ fontSize: '13px', color: '#9EA3AD' }}>명세서 전송과 별개로 이체 여부를 기록해요</p>
                </div>
                <button
                  onClick={() => { if (isTransferred) { setIsTransferred(false); localStorage.removeItem(`payslip_transferred_${staffName}`); } else { setTransferConfirmOpen(true); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 14px', borderRadius: '10px', border: `1px solid ${isTransferred ? 'rgba(16,201,125,0.3)' : '#DBDCDF'}`, backgroundColor: isTransferred ? 'rgba(16,201,125,0.08)' : '#FFFFFF', fontSize: '14px', fontWeight: 600, color: isTransferred ? '#10C97D' : '#70737B', cursor: 'pointer' }}>
                  {isTransferred && <Check style={{ width: '14px', height: '14px' }} />}
                  {isTransferred ? '이체 완료' : '이체 확인'}
                </button>
              </div>
            </div>
            <Divider thick />
          </>
        )}

        {/* 고지 문구 — 실제 적용된 항목/요율 동적 생성 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <p style={{ fontSize: '12px', color: '#9EA3AD', lineHeight: '1.7' }}>
            {(() => {
              const items: string[] = [];
              if (parseAmt(pensionVal) > 0) items.push(`국민연금(4.5%)`);
              if (parseAmt(healthVal) > 0) items.push(`건강보험(3.545%)`);
              if (parseAmt(ltcVal) > 0) items.push(`장기요양보험(건강보험료의 12.81%)`);
              if (parseAmt(employVal) > 0) items.push(`고용보험(0.9%)`);
              const hasSocialInsurance = items.length > 0;
              const hasIncomeTax = parseAmt(incomeTaxVal) > 0 || parseAmt(localTaxVal) > 0;
              const parts: string[] = [];
              if (hasSocialInsurance) parts.push(`${items.join(', ')} 등 법정 4대 보험 요율을 적용하여 공제하였으며`);
              if (hasIncomeTax) {
                const taxParts: string[] = [];
                if (parseAmt(incomeTaxVal) > 0) taxParts.push('근로소득세');
                if (parseAmt(localTaxVal) > 0) taxParts.push('지방소득세');
                parts.push(`${taxParts.join(' 및 ')}가 함께 공제되었습니다`);
              }
              if (parts.length === 0) return '본 급여명세서는 공제 항목이 없습니다.';
              return `본 급여명세서는 ${parts.join(', ')}.`;
            })()}
          </p>
        </div>
      </div>

      {/* ④ 하단 버튼 — 전송 완료 시 비활성 단일 버튼 */}
      {createPortal(
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
          <div style={{ maxWidth: "512px", margin: "0 auto", padding: "16px 20px" }}>
            {isPublished ? (
              <button disabled style={{ width: '100%', height: '56px', backgroundColor: '#F7F7F8', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#AAB4BF', cursor: 'default' }}>
                급여 명세서 발급 완료
              </button>
            ) : (
              <button onClick={() => setSendSheetOpen(true)} style={{ width: '100%', height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
                급여 명세서 발급하기
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 전송 확인 바텀시트 */}
      {sendSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => setSendSheetOpen(false)}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>급여명세서 발급</h2>
                <button onClick={() => setSendSheetOpen(false)} className="pressable">
                  <X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} />
                </button>
              </div>
              <p style={{ fontSize: '15px', color: '#19191B', marginBottom: '4px' }}>
                <span style={{ color: '#4261FF', fontWeight: 600 }}>{staffName}</span> 님에게 급여명세서를 전송할게요
              </p>
              <div style={{ padding: '10px 14px', backgroundColor: '#FFF8E1', borderRadius: '10px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#92400E' }}>※ 명세서 전송은 내역 공유예요. <span style={{ fontWeight: 700 }}>실제 이체는 사장님이 직접</span> 진행해주세요.</p>
              </div>
              <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '8px' }}>전달 코멘트 (선택)</p>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="내용 입력"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: '100%', height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button onClick={() => setConfirmOpen(true)} style={{ width: '100%', height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
                급여명세서 발급하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 발급 확인 팝업 */}
      {confirmOpen && createPortal(
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center" onClick={() => setConfirmOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.02em' }}>급여명세서 발급하기</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6', letterSpacing: '-0.02em' }}>
              발급 후에는 수정이 불가능해요.<br />급여명세서를 발급하시겠어요?
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#70737B', backgroundColor: '#F7F7F8', cursor: 'pointer', letterSpacing: '-0.02em' }}>취소</button>
              <button onClick={() => { setConfirmOpen(false); handleSend(); }} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>발급하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ③ 이체 완료 확인 팝업 — UI 통일 */}
      {transferConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center" onClick={() => setTransferConfirmOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.02em' }}>이체 완료 처리</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6', letterSpacing: '-0.02em' }}>{staffName}님 급여를 실제로<br />이체하셨나요?</p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setTransferConfirmOpen(false)} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#70737B', backgroundColor: '#F7F7F8', cursor: 'pointer', letterSpacing: '-0.02em' }}>취소</button>
              <button onClick={handleTransferConfirm} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>이체 완료</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
