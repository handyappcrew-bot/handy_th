import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const SHIFT_BADGE: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const STAFF_LIST = [
  { name: "김정민", shifts: ["오픈"], type: "정규직", workDays: "월, 화, 수, 목, 금", salaryType: "시급" as const, hourlyWage: 10000, avatarColor: "#5C4033" },
  { name: "문자영", shifts: ["오픈", "미들"], type: "알바생", workDays: "월, 화", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#C0392B" },
  { name: "정수민", shifts: ["미들"], type: "알바생", workDays: "월, 화, 수", salaryType: "월급" as const, monthlyWage: 1500000, avatarColor: "#F4D03F" },
  { name: "김수민", shifts: ["미들"], type: "알바생", workDays: "화, 수", salaryType: "연봉" as const, annualWage: 36000000, avatarColor: "#2C3E50" },
  { name: "키키치", shifts: ["미들"], type: "알바생", workDays: "목", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#8E44AD" },
];

interface DailySalaryDetail {
  base: number; workTime?: string; breakTime?: string; baseHours?: string;
  overtimeExtra?: string; overtime?: number; overtimeHours?: string;
  weekly?: number; weeklyNote?: string; incentive?: number;
  night?: number; nightHours?: string;
  holiday?: number; holidayHours?: string;
}

const STAFF_INDIVIDUAL_SALARY_DETAIL: Record<number, DailySalaryDetail> = {
  1:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h" },
  5:  { base: 40000, workTime: "08:00 - 14:00", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h", overtime: 5500, overtimeHours: "13:00 - 14:00 / (1h, 시급 10,000원 × 1.5배)" },
  6:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", weekly: 8000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
  7:  { base: 45000, workTime: "08:00 - 13:30", breakTime: "30분", baseHours: "4h 30m", holiday: 6000, holidayHours: "08:00 - 13:30 / (4h 30m, 시급 10,000원 × 1.5배)" },
  8:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", night: 3000, nightHours: "22:00 - 23:00 / (1h, 시급 10,000원 × 0.5배 추가)" },
  10: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", incentive: 5000 },
  13: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h 12m", overtime: 6000, overtimeHours: "13:00 - 14:12 / (1h 12m, 시급 10,000원 × 1.5배)", incentive: 4000 },
  14: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", weekly: 9000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
  15: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", night: 5000, nightHours: "22:00 - 23:00 / (1h, 시급 10,000원 × 0.5배 추가)" },
  20: { base: 40000, workTime: "08:00 - 14:30", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h 30m", overtime: 7000, overtimeHours: "13:00 - 14:30 / (1h 30m, 시급 10,000원 × 1.5배)", weekly: 3000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
};

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

// PayslipEdit과 동일한 InputBottomSheet
function InputBottomSheet({ open, onClose, label, color, value, onConfirm }: {
  open: boolean; onClose: () => void; label: string; color: string;
  value: string; onConfirm: (v: string) => void;
}) {
  const toFormatted = (raw: string) => {
    const num = parseInt(raw.replace(/,/g, '').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? "0" : num.toLocaleString();
  };
  const [local, setLocal] = useState(toFormatted(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLocal(toFormatted(value));
      setTimeout(() => {
        inputRef.current?.focus();
        const len = inputRef.current?.value.length || 0;
        inputRef.current?.setSelectionRange(len, len);
      }, 100);
    }
  }, [open, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    if (raw === '') { setLocal('0'); return; }
    setLocal(parseInt(raw, 10).toLocaleString());
  };
  const handleConfirm = () => { onConfirm(local); onClose(); };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={onClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>
              <span style={{ color }}>{label}</span> 수정
            </h2>
            <button onClick={onClose} className="pressable">
              <X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', border: '2px solid #4261FF', borderRadius: '10px', backgroundColor: '#FFFFFF', marginBottom: '16px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <input
              ref={inputRef}
              type="text" inputMode="numeric"
              value={local}
              onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              className="min-w-0 w-full bg-transparent text-right"
              style={{ fontSize: '18px', fontWeight: 600, color: '#19191B', border: 'none', outline: '0', outlineWidth: 0, boxShadow: 'none', WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
            />
            <span style={{ fontSize: '16px', color: '#AAB4BF', marginLeft: '8px', flexShrink: 0 }}>원</span>
          </div>
          <button onClick={handleConfirm}
            style={{ width: '100%', height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
            입력 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// PayslipEdit과 동일한 EditRow
function EditRow({ label, labelColor = '#70737B', value, onEdit, subNote, originalValue }: {
  label: React.ReactNode; labelColor?: string; value: string;
  onEdit: () => void; subNote?: string; originalValue?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const isChanged = originalValue !== undefined && value !== originalValue;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: labelColor, width: '114px', flexShrink: 0, paddingTop: '14px' }}>{label}</span>
        <button
          onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)} onClick={onEdit}
          style={{ flex: 1, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', border: pressed ? '2px solid #4261FF' : isChanged ? '2px solid #FF8F00' : '1px solid #DBDCDF', borderRadius: '10px', backgroundColor: isChanged ? '#FFFBF5' : '#FFFFFF', cursor: 'pointer', transition: 'border 0.15s', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{value}</span>
          <span style={{ fontSize: '16px', color: '#AAB4BF' }}>원</span>
        </button>
      </div>
      {isChanged && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{originalValue}원</span>
          <span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span>
          <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{value}원으로 수정</span>
        </div>
      )}
      {subNote && <p style={{ fontSize: '12px', color: '#9EA3AD', textAlign: 'right', marginTop: '4px' }}>{subNote}</p>}
    </div>
  );
}

const parseAmt = (s: string) => parseInt(s.replace(/,/g, ''), 10) || 0;
const fmt = (n: number) => n.toLocaleString();

export default function SalaryDetailEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const staffName = searchParams.get("name") || "정수민";
  const dateStr = searchParams.get("date") || "2025-10-15";
  const date = new Date(dateStr);
  const dayNum = date.getDate();

  const staff = STAFF_LIST.find(s => s.name === staffName) || STAFF_LIST[0];
  const detail = STAFF_INDIVIDUAL_SALARY_DETAIL[dayNum] || {
    base: staff.salaryType !== "시급" ? Math.round((staff as any).monthlyWage ? (staff as any).monthlyWage / 22 : (staff as any).annualWage / 264) : 0,
  };

  const monthDay = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_LABELS[date.getDay()]})`;

  // 초기값
  const INIT = {
    base:      fmt(detail.base),
    overtime:  fmt(detail.overtime || 0),
    night:     fmt(detail.night || 0),
    holiday:   fmt(detail.holiday || 0),
    weekly:    fmt(detail.weekly || 0),
    incentive: fmt(detail.incentive || 0),
  };

  const [vals, setVals] = useState({ ...INIT });
  const [activeSheet, setActiveSheet] = useState<keyof typeof INIT | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const isDirty = Object.keys(INIT).some(k => vals[k as keyof typeof INIT] !== INIT[k as keyof typeof INIT]);

  const totalPay = parseAmt(vals.base) + parseAmt(vals.overtime) + parseAmt(vals.night) + parseAmt(vals.holiday) + parseAmt(vals.weekly) + parseAmt(vals.incentive);

  const handleBack = () => {
    if (isDirty) { setCancelConfirmOpen(true); } else { navigate(-1); }
  };

  const handleSave = () => setSaveConfirmOpen(true);

  const handleSaveConfirm = () => {
    setSaveConfirmOpen(false);
    toast({ description: "급여 정보가 수정되었어요.", duration: 2000 });
    setTimeout(() => navigate(-1), 500);
  };

  const FIELD_META: Record<keyof typeof INIT, { label: string; color: string }> = {
    base:      { label: '기본급',    color: '#19191B' },
    overtime:  { label: '연장 수당', color: '#FF862D' },
    night:     { label: '야간 수당', color: '#6B4FEC' },
    holiday:   { label: '휴일 수당', color: '#E05C00' },
    weekly:    { label: '주휴 수당', color: '#213DD9' },
    incentive: { label: '기타 수당', color: '#10C97D' },
  };

  const hourlyWage = staff.salaryType === "시급" ? (staff as any).hourlyWage : 0;
  const basePayLabel = () => {
    if (staff.salaryType === "시급") return `시급 ${fmt(hourlyWage)}원 기준`;
    if (staff.salaryType === "월급") return `월급 ${fmt((staff as any).monthlyWage)}원 (일할 계산)`;
    return `연봉 ${((staff as any).annualWage / 10000).toFixed(0)}만원 (일할 계산)`;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={handleBack} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여 수정</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 날짜 + 직원 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>{monthDay}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: staff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
              {staff.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
              {staff.shifts.map(sh => <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[sh] || ''}`}>{sh}</span>)}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{staff.type}</span>
            </div>
          </div>
        </div>

        <Divider thick />

        {/* 기본 급여 수정 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>기본 급여</SectionTitle>
          <EditRow label="기본급" value={vals.base} originalValue={INIT.base}
            subNote={basePayLabel()} onEdit={() => setActiveSheet('base')} />
          <EditRow label={<span style={{ color: '#FF862D' }}>연장 수당</span>} labelColor="#FF862D"
            value={vals.overtime} originalValue={INIT.overtime}
            subNote={detail.overtimeHours?.split(' / ')[1]}
            onEdit={() => setActiveSheet('overtime')} />
          <EditRow label={<span style={{ color: '#6B4FEC' }}>야간 수당</span>} labelColor="#6B4FEC"
            value={vals.night} originalValue={INIT.night}
            subNote={detail.nightHours?.split(' / ')[1]}
            onEdit={() => setActiveSheet('night')} />
          <EditRow label={<span style={{ color: '#E05C00' }}>휴일 수당</span>} labelColor="#E05C00"
            value={vals.holiday} originalValue={INIT.holiday}
            subNote={detail.holidayHours?.split(' / ')[1]}
            onEdit={() => setActiveSheet('holiday')} />
          <EditRow label={<span style={{ color: '#213DD9' }}>주휴 수당</span>} labelColor="#213DD9"
            value={vals.weekly} originalValue={INIT.weekly}
            subNote={detail.weeklyNote}
            onEdit={() => setActiveSheet('weekly')} />
        </div>

        <Divider thick />

        {/* 추가 수당 수정 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>추가 수당</SectionTitle>
          <EditRow
            label={<><span style={{ color: '#10C97D' }}>기타 수당</span><br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>(인센티브)</span></>}
            labelColor="#10C97D"
            value={vals.incentive} originalValue={INIT.incentive}
            onEdit={() => setActiveSheet('incentive')} />
        </div>

        <Divider thick />

        {/* 수정 후 급여 합계 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>수정 후 금일 급여액</SectionTitle>
          <div style={{ backgroundColor: '#F0F4FF', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#70737B', margin: '0 0 8px' }}>
              기본급 {vals.base}원
              {parseAmt(vals.overtime) > 0 ? ` + 연장 ${vals.overtime}원` : ''}
              {parseAmt(vals.night) > 0 ? ` + 야간 ${vals.night}원` : ''}
              {parseAmt(vals.holiday) > 0 ? ` + 휴일 ${vals.holiday}원` : ''}
              {parseAmt(vals.weekly) > 0 ? ` + 주휴 ${vals.weekly}원` : ''}
              {parseAmt(vals.incentive) > 0 ? ` + 인센티브 ${vals.incentive}원` : ''}
            </p>
            <p style={{ textAlign: 'right', fontSize: '22px', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em', margin: 0 }}>{fmt(totalPay)}원</p>
          </div>
        </div>

      </div>

      {/* 하단 버튼 */}
      {createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderTop: '1px solid #F7F7F8' }}>
          <div style={{ maxWidth: '512px', margin: '0 auto', padding: '16px 20px', display: 'flex', gap: '8px' }}>
            <button onClick={handleBack}
              style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
              취소
            </button>
            <button onClick={handleSave}
              style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
              수정하기
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 수정 바텀시트 */}
      {activeSheet && (
        <InputBottomSheet
          open={!!activeSheet}
          onClose={() => setActiveSheet(null)}
          label={FIELD_META[activeSheet].label}
          color={FIELD_META[activeSheet].color}
          value={vals[activeSheet]}
          onConfirm={(v) => setVals(prev => ({ ...prev, [activeSheet]: v }))}
        />
      )}

      {/* 취소 확인 팝업 */}
      {cancelConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={() => setCancelConfirmOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>수정 취소</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.6' }}>수정 중인 내용이 저장되지 않아요.<br />정말 취소하시겠어요?</p>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setCancelConfirmOpen(false)} style={{ flex: 1, height: '56px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#F7F7F8', color: '#70737B' }}>아니요</button>
              <button onClick={() => navigate(-1)} style={{ flex: 1, height: '56px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#4261FF', color: '#FFFFFF' }}>취소하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 수정 완료 확인 팝업 */}
      {saveConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={() => setSaveConfirmOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>급여 수정</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.6' }}>입력한 내용으로 급여 정보를<br />수정하시겠어요?</p>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setSaveConfirmOpen(false)} style={{ flex: 1, height: '56px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#F7F7F8', color: '#70737B' }}>취소</button>
              <button onClick={handleSaveConfirm} style={{ flex: 1, height: '56px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#4261FF', color: '#FFFFFF' }}>수정하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
