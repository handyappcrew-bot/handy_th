import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Info } from "lucide-react";

type PayslipStatus = "지급 전" | "지급 완료";
interface PayslipRecord {
  name: string; shifts: string[]; type: string; amount: number;
  avatarColor: string; status: PayslipStatus; payDay: string;
  period: string; transferred: boolean; year: number; month: number;
}

const PAYSLIP_HISTORY: PayslipRecord[] = [
  // 2026년 4월 (이번 달) — 발급 대기: 오늘~+3일 payDay로 세팅
  { name: "정수민", shifts: ["오픈"], type: "정규직", amount: 1924612, avatarColor: "#F4D03F", status: "지급 전", payDay: "19일", period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 },
  { name: "김정민", shifts: ["오픈"], type: "정규직", amount: 1650000, avatarColor: "#5C4033", status: "지급 전", payDay: "21일", period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 },
  { name: "가나디", shifts: ["미들"], type: "알바생", amount: 880000, avatarColor: "#5C4033", status: "지급 전", payDay: "22일", period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 },
  // 발급 완료 — 이체 완료 / 이체 확인 혼재
  { name: "문자영", shifts: ["미들"], type: "알바생", amount: 490000, avatarColor: "#C0392B", status: "지급 완료", payDay: "1일, 15일", period: "2026.04.01 - 2026.04.30", transferred: true, year: 2026, month: 4 },
  { name: "이클립스", shifts: ["마감"], type: "정규직", amount: 1280000, avatarColor: "#8E44AD", status: "지급 완료", payDay: "25일", period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 },
  { name: "박지훈", shifts: ["마감"], type: "알바생", amount: 760000, avatarColor: "#27AE60", status: "지급 완료", payDay: "10일", period: "2026.04.01 - 2026.04.30", transferred: true, year: 2026, month: 4 },
  // 2026년 3월
  { name: "정수민", shifts: ["오픈"], type: "정규직", amount: 1890000, avatarColor: "#F4D03F", status: "지급 완료", payDay: "15일", period: "2026.03.01 - 2026.03.31", transferred: true, year: 2026, month: 3 },
  { name: "김정민", shifts: ["오픈"], type: "정규직", amount: 1620000, avatarColor: "#5C4033", status: "지급 완료", payDay: "15일", period: "2026.03.01 - 2026.03.31", transferred: true, year: 2026, month: 3 },
  { name: "가나디", shifts: ["미들"], type: "알바생", amount: 840000, avatarColor: "#5C4033", status: "지급 완료", payDay: "말일", period: "2026.03.01 - 2026.03.31", transferred: true, year: 2026, month: 3 },
  { name: "문자영", shifts: ["미들"], type: "알바생", amount: 510000, avatarColor: "#C0392B", status: "지급 완료", payDay: "1일, 15일", period: "2026.03.01 - 2026.03.31", transferred: true, year: 2026, month: 3 },
  { name: "이클립스", shifts: ["마감"], type: "정규직", amount: 1280000, avatarColor: "#8E44AD", status: "지급 완료", payDay: "25일", period: "2026.03.01 - 2026.03.31", transferred: true, year: 2026, month: 3 },
  // 2026년 2월
  { name: "정수민", shifts: ["오픈"], type: "정규직", amount: 1750000, avatarColor: "#F4D03F", status: "지급 완료", payDay: "15일", period: "2026.02.01 - 2026.02.28", transferred: true, year: 2026, month: 2 },
  { name: "김정민", shifts: ["오픈"], type: "정규직", amount: 1580000, avatarColor: "#5C4033", status: "지급 완료", payDay: "15일", period: "2026.02.01 - 2026.02.28", transferred: true, year: 2026, month: 2 },
  { name: "가나디", shifts: ["미들"], type: "알바생", amount: 760000, avatarColor: "#5C4033", status: "지급 완료", payDay: "말일", period: "2026.02.01 - 2026.02.28", transferred: true, year: 2026, month: 2 },
  { name: "문자영", shifts: ["미들"], type: "알바생", amount: 480000, avatarColor: "#C0392B", status: "지급 완료", payDay: "1일, 15일", period: "2026.02.01 - 2026.02.28", transferred: false, year: 2026, month: 2 },
];

// 현재 달 데이터 (기존 코드 호환용)
const PAYSLIP_STAFF_LIST = PAYSLIP_HISTORY.filter(s => s.year === 2026 && s.month === 4);
// 테스트용 발급 기록 초기화
["정수민","김정민","가나디"].forEach(name => localStorage.removeItem(`payslip_published_${name}`));

// 테스트용: 오늘/내일 배너 강제 노출
const _today = new Date();
const _todayDay = _today.getDate();
const _lastDay = new Date(_today.getFullYear(), _today.getMonth() + 1, 0).getDate();
const _tomorrowDay = _todayDay === _lastDay ? 1 : _todayDay + 1;
if (!PAYSLIP_STAFF_LIST.some(s => s.payDay === `${_todayDay}일`)) {
  PAYSLIP_STAFF_LIST.push({ name: "테스트(오늘)", shifts: ["오픈"], type: "알바생", amount: 500000, avatarColor: "#FF3D3D", status: "지급 전", payDay: `${_todayDay}일`, period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 });
}
if (!PAYSLIP_STAFF_LIST.some(s => s.payDay === `${_tomorrowDay}일`)) {
  PAYSLIP_STAFF_LIST.push({ name: "테스트(내일)", shifts: ["오픈"], type: "알바생", amount: 300000, avatarColor: "#FF8F00", status: "지급 전", payDay: `${_tomorrowDay}일`, period: "2026.04.01 - 2026.04.30", transferred: false, year: 2026, month: 4 });
}

// 캘린더 테스트용 2025년 10월 데이터 (10일=이체완료, 31일=미이체)
const CALENDAR_PAYDAY_DATA = [
  { payDay: "10일", transferred: true },
  { payDay: "31일", transferred: false },
];

function PayslipTab({ navigate }: { navigate: (path: string) => void }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(() => {
    const y = parseInt(new URLSearchParams(window.location.search).get('py') || '');
    return isNaN(y) ? currentYear : y;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = parseInt(new URLSearchParams(window.location.search).get('pm') || '');
    return isNaN(m) ? currentMonth : m;
  });
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);

  const monthList = PAYSLIP_HISTORY.filter(s => s.year === selectedYear && s.month === selectedMonth);

  const getKey = (s: typeof PAYSLIP_HISTORY[0]) => `${s.year}-${s.month}-${s.name}`;

  const [publishedSet, setPublishedSet] = useState<Set<string>>(new Set(PAYSLIP_HISTORY.filter(s => s.status === "지급 완료" && !(s.year === 2026 && s.month === 4 && ["정수민","김정민","가나디"].includes(s.name))).map(s => getKey(s))));
  const [transferredMap, setTransferredMap] = useState<Record<string, string>>(() => {
    const preset = Object.fromEntries(PAYSLIP_HISTORY.filter(s => s.transferred).map(s => [getKey(s), 'preset']));
    const fromStorage: Record<string, string> = {};
    PAYSLIP_HISTORY.forEach(s => {
      const val = localStorage.getItem(`payslip_transferred_2026_4_${s.name}`);
      if (val) fromStorage[getKey(s)] = val;
    });
    return { ...preset, ...fromStorage };
  });
  const [transferTarget, setTransferTarget] = useState<typeof PAYSLIP_HISTORY[0] | null>(null);

  const getDaysUntilPayday = (payDay: string) => {
    const now = new Date();
    const todayDate = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = payDay.split(',').map(d => {
      const t = d.trim();
      if (t === '말일') return lastDay;
      return parseInt(t);
    }).filter(n => !isNaN(n));
    if (days.length === 0) return 999;
    const nearest = days.map(day => day >= todayDate ? day - todayDate : day + lastDay - todayDate).sort((a, b) => a - b)[0];
    return nearest;
  };
  const unpaidList = monthList.filter(s => !publishedSet.has(getKey(s)));
  const paidList = monthList.filter(s => publishedSet.has(getKey(s)));

  const fmtTime = (iso: string) => {
    if (iso === 'preset') return '';
    const d = new Date(iso);
    return `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 이체`;
  };

  useEffect(() => {
    const check = () => {
      PAYSLIP_HISTORY.filter(s => s.status === "지급 전").forEach(s => {
        if (localStorage.getItem(`payslip_published_${s.name}`)) {
          setPublishedSet(prev => { const next = new Set(prev); next.add(getKey(s)); return next; });
        }
      });
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);

  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();

  // 이전/다음 달 이동
  const goPrev = () => {
    if (selectedMonth === 1) { setSelectedYear(y => y - 1); setSelectedMonth(12); }
    else setSelectedMonth(m => m - 1);
  };
  const goNext = () => {
    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth)) return;
    if (selectedMonth === 12) { setSelectedYear(y => y + 1); setSelectedMonth(1); }
    else setSelectedMonth(m => m + 1);
  };
  const canGoNext = !(selectedYear === currentYear && selectedMonth >= currentMonth);

  const StaffCard = ({ s, isPaid }: { s: typeof PAYSLIP_HISTORY[0]; isPaid: boolean }) => {
    const isTransferred = !!(transferredMap[getKey(s)]);
    return (
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '10px', overflow: 'hidden' }}>
        <button className="pressable w-full text-left"
          style={{ padding: '14px 16px 10px', display: 'block' }}
          onClick={() => { if (isPaid) { navigate(`/owner/salary/payslip/publish?name=${encodeURIComponent(s.name)}&published=true&py=${selectedYear}&pm=${selectedMonth}`); } else { navigate(`/owner/salary/payslip?name=${encodeURIComponent(s.name)}&py=${selectedYear}&pm=${selectedMonth}`); } }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: s.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0, opacity: isPaid ? 0.6 : 1 }}>{s.name.charAt(0)}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: isPaid ? '#9EA3AD' : '#19191B' }}>{s.name}</span>
                  {s.shifts.map(sh => (<span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sh === "오픈" ? "bg-shift-open-bg text-shift-open" : sh === "미들" ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>{sh}</span>))}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.type}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{s.period} 급여명세서</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: isPaid ? '#9EA3AD' : '#4261FF', letterSpacing: '-0.02em' }}>{s.amount.toLocaleString()}원</p>
              
              
            </div>
          </div>
        </button>
        <div style={{ borderTop: '1px solid #F0F0F0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#9EA3AD' }}>급여일</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#70737B' }}>매월 {s.payDay}</span>
            {!isPaid && (() => {
              const now = new Date();
              const todayDate = now.getDate();
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const days = s.payDay.split(',').map(d => {
                const t = d.trim();
                if (t === '말일') return lastDay;
                return parseInt(t);
              }).filter(n => !isNaN(n));
              const nearest = days.map(day => ({ day, diff: day >= todayDate ? day - todayDate : day + lastDay - todayDate })).sort((a, b) => a.diff - b.diff)[0];
              if (!nearest) return null;
              const label = nearest.diff === 0 ? 'D-day' : `D-${nearest.diff}`;
              const color = nearest.diff === 0 ? '#FF3D3D' : nearest.diff === 1 ? '#FF8F00' : '#9EA3AD';
              return <span style={{ fontSize: '11px', fontWeight: 700, color }}>({label})</span>;
            })()}
          </div>
          {isPaid && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <button
                onClick={() => !isTransferred && setTransferTarget(s)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '28px', padding: '0 10px', borderRadius: '8px', border: `1px solid ${isTransferred ? '#DBDCDF' : '#FFB300'}`, backgroundColor: isTransferred ? '#F7F7F8' : '#FFB300', fontSize: '12px', fontWeight: 600, color: isTransferred ? '#AAB4BF' : '#FFFFFF', cursor: isTransferred ? 'default' : 'pointer' }}>
                {isTransferred ? '✓ 이체 완료' : '이체 확인'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* 월 선택 네비게이터 */}
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={goPrev} className="pressable p-1">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={() => { setPickerYear(selectedYear); setMonthPickerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{selectedYear}년 {selectedMonth}월 급여</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={goNext} className="pressable p-1" disabled={!canGoNext} style={{ opacity: canGoNext ? 1 : 0.3 }}>
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
      <p style={{ fontSize: '12px', color: '#9EA3AD', textAlign: 'center', marginTop: '2px' }}>
        {selectedYear}.{String(selectedMonth).padStart(2,'0')}.01 - {selectedYear}.{String(selectedMonth).padStart(2,'0')}.{String(lastDay).padStart(2,'0')}
      </p>

      {/* 안내 배너 */}
      {isCurrentMonth && (() => {
        const hasUnpaid = unpaidList.length > 0;
        const allPaidTransferred = paidList.length > 0 && paidList.every(s => !!transferredMap[getKey(s)]);
        // 발급 대기 있을 때: 이체 안내 (발급완료 전원 이체완료면 비노출)
        if (hasUnpaid) {
          return (
            <div style={{ margin: '10px 20px 0', padding: '10px 14px', backgroundColor: '#F0F3FF', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Info className="w-4 h-4 flex-shrink-0" style={{ color: '#4261FF', marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#4261FF', lineHeight: '1.5', margin: 0 }}>
                급여명세서 발급 후 <span style={{ fontWeight: 700 }}>실제 이체는 별도로</span> 진행하고 이체 확인을 눌러주세요.
              </p>
            </div>
          );
        }
        return (
          <div style={{ margin: '10px 20px 0', padding: '10px 14px', backgroundColor: '#F0F3FF', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info className="w-4 h-4 flex-shrink-0" style={{ color: '#4261FF', marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: '#4261FF', lineHeight: '1.5', margin: 0 }}>
              급여일 <span style={{ fontWeight: 700 }}>3일 전부터</span> 발급 대기 목록에 노출돼요.
            </p>
          </div>
        );
      })()}

      {/* 데이터 없을 때 */}
      {monthList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '14px', color: '#9EA3AD' }}>{selectedYear}년 {selectedMonth}월 급여 명세서가 없어요</p>
        </div>
      ) : (
        <>
          {/* 발행 대기 섹션 */}
          {unpaidList.length > 0 && (
            <div style={{ padding: '14px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>발급 대기</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#4261FF', backgroundColor: '#E8F3FF', padding: '2px 10px', borderRadius: '9999px' }}>{unpaidList.length}명</span>
              </div>
              {unpaidList.map((s, i) => <StaffCard key={i} s={s} isPaid={false} />)}
            </div>
          )}

          {unpaidList.length > 0 && paidList.length > 0 && (
            <div style={{ height: '12px', backgroundColor: '#F7F7F8', margin: '6px 0' }} />
          )}

          {/* 발행 완료 섹션 */}
          {paidList.length > 0 && (
            <div style={{ padding: unpaidList.length > 0 ? '8px 20px 0' : '14px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#70737B' }}>발급 완료</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#AAB4BF', backgroundColor: '#F7F7F8', padding: '2px 10px', borderRadius: '9999px' }}>{paidList.length}명</span>
              </div>
              {paidList.map((s, i) => <StaffCard key={i} s={s} isPaid={true} />)}
            </div>
          )}
        </>
      )}

      {/* 월 선택 팝업 */}
      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '20px', width: '300px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button onClick={() => setPickerYear(y => y - 1)} className="pressable p-1"><ChevronLeft className="w-5 h-5" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => { if (pickerYear < currentYear) setPickerYear(y => y + 1); }} className="pressable p-1" style={{ opacity: pickerYear < currentYear ? 1 : 0.3 }}><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const isFuture = pickerYear > currentYear || (pickerYear === currentYear && m > currentMonth);
                const isSelected = pickerYear === selectedYear && m === selectedMonth;
                const hasData = PAYSLIP_HISTORY.some(s => s.year === pickerYear && s.month === m);
                return (
                  <button key={m} onClick={() => { if (!isFuture) { setSelectedYear(pickerYear); setSelectedMonth(m); setMonthPickerOpen(false); } }}
                    style={{ padding: '10px 4px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, backgroundColor: isSelected ? '#4261FF' : '#F7F7F8', color: isFuture ? '#DBDCDF' : isSelected ? '#FFFFFF' : '#19191B', border: 'none', cursor: isFuture ? 'default' : 'pointer', position: 'relative' }}>
                    {m}월
                    {hasData && !isSelected && !isFuture && (
                      <span style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#4261FF', display: 'block' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    {/* 이체 완료 확인 팝업 */}
      {transferTarget && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center" onClick={() => setTransferTarget(null)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.02em' }}>이체 완료 처리</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6', letterSpacing: '-0.02em' }}>
              {transferTarget.name}님 급여를 실제로<br />이체하셨나요?
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setTransferTarget(null)} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#70737B', backgroundColor: '#F7F7F8', cursor: 'pointer', letterSpacing: '-0.02em' }}>취소</button>
              <button onClick={() => { const now = new Date().toISOString(); localStorage.setItem(`payslip_transferred_2026_4_${transferTarget.name}`, now); setTransferredMap(prev => ({ ...prev, [getKey(transferTarget)]: now })); setTransferTarget(null); }} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>이체 완료</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
const HAS_DATA = true;

const STAFF_LIST = [
  { name: "김정민", shifts: ["오픈"], type: "정규직", workDays: "월, 화, 수, 목, 금", salaryType: "시급" as const, hourlyWage: 10000, avatarColor: "#5C4033",
    salary: { workHours: "43h", overtime: "+4h 30m", basePay: 430000, overtimePay: 15195, weeklyPay: 12196, nightPay: 0, holidayPay: 0, incentive: 0, totalPay: 457391,
      deductions: { incomeTax: 2060, localTax: 206, nationalPension: 20610, healthInsurance: 15550, longTermCare: 2010, employmentInsurance: 7770 } } },
  { name: "문자영", shifts: ["오픈", "미들"], type: "알바생", workDays: "월, 화", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#C0392B",
    salary: { workHours: "20h", overtime: null, basePay: 220000, overtimePay: 0, weeklyPay: 0, nightPay: 16500, holidayPay: 11000, incentive: 0, totalPay: 247500,
      deductions: { incomeTax: 1060, localTax: 106, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 4015 } } },
  { name: "정수민", shifts: ["미들"], type: "알바생", workDays: "월, 화, 수", salaryType: "월급" as const, monthlyWage: 1500000, avatarColor: "#F4D03F",
    salary: { workHours: "60h", overtime: "+2h", basePay: 1500000, overtimePay: 27500, weeklyPay: 0, nightPay: 0, holidayPay: 0, incentive: 50000, totalPay: 1577500,
      deductions: { incomeTax: 25190, localTax: 2519, nationalPension: 71250, healthInsurance: 53925, longTermCare: 6970, employmentInsurance: 13500 } } },
  { name: "김수민", shifts: ["미들"], type: "알바생", workDays: "화, 수", salaryType: "연봉" as const, annualWage: 36000000, avatarColor: "#2C3E50",
    salary: { workHours: "80h", overtime: null, basePay: 3000000, overtimePay: 0, weeklyPay: 0, nightPay: 45000, holidayPay: 0, incentive: 100000, totalPay: 3145000,
      deductions: { incomeTax: 130000, localTax: 13000, nationalPension: 135000, healthInsurance: 102060, longTermCare: 13190, employmentInsurance: 27000 } } },
  { name: "키키치", shifts: ["미들"], type: "알바생", workDays: "목", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#8E44AD",
    salary: { workHours: "8h", overtime: null, basePay: 88000, overtimePay: 0, weeklyPay: 0, nightPay: 0, holidayPay: 0, incentive: 0, totalPay: 88000,
      deductions: { incomeTax: 396, localTax: 39, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 792 } } },
];

const STAFF_SALARY = [
  { name: "정수민", status: "지급 전" as const, amount: 1200000 },
  { name: "김수민", status: "지급 전" as const, amount: 560000 },
  { name: "지수민", status: "지급 완료" as const, amount: 660000 },
  { name: "강수민", status: "지급 완료" as const, amount: 660000 },
  { name: "송수민", status: "지급 완료" as const, amount: 660000 },
  { name: "이수민", status: "지급 완료" as const, amount: 660000 },
  { name: "윤수민", status: "지급 완료" as const, amount: 660000 },
];

const MONTHLY_SALARY: Record<number, number> = {
  1: 452000, 2: 558000, 3: 400000, 4: 500000, 5: 450000, 6: 250000, 7: 350000,
  8: 450000, 9: 500000, 10: 400000, 11: 500000, 12: 450000, 13: 250000, 14: 350000,
  15: 450000, 16: 550000, 17: 400000, 18: 500000, 19: 450000, 20: 451000, 21: 350000,
  22: 450000, 23: 500000, 24: 400000, 25: 500000, 26: 450000, 27: 250000, 28: 350000,
  29: 450000, 30: 500000, 31: 400000,
};

interface DailySalaryDetail {
  base: number;
  overtime?: number;    // 연장수당
  weekly?: number;      // 주휴수당
  incentive?: number;   // 인센티브
  night?: number;       // 야간수당
  holiday?: number;     // 휴일수당
}
const STAFF_INDIVIDUAL_SALARY_DETAIL: Record<number, DailySalaryDetail> = {
  1:  { base: 40000 },
  5:  { base: 40000, overtime: 5500 },
  6:  { base: 40000, weekly: 8000 },
  7:  { base: 45000, holiday: 6000 },
  8:  { base: 40000, night: 3000 },
  10: { base: 40000, incentive: 5000 },
  13: { base: 40000, overtime: 6000, incentive: 4000 },
  14: { base: 40000, weekly: 9000 },
  15: { base: 40000, night: 5000 },
  20: { base: 40000, overtime: 7000, weekly: 3000 },
};
const STAFF_INDIVIDUAL_SALARY: Record<number, number> = Object.fromEntries(
  Object.entries(STAFF_INDIVIDUAL_SALARY_DETAIL).map(([k, v]) =>
    [k, v.base + (v.overtime || 0) + (v.weekly || 0) + (v.incentive || 0) + (v.night || 0) + (v.holiday || 0)]
  )
);

const PAYDAY = [10, 31];
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const DAILY_STAFF_BY_DATE: Record<number, { name: string; shift: string; type: string; amount: number; hours: string; avatarColor: string; payday: boolean; overtime?: string; night?: string; weekly?: string; incentive?: string; holiday?: string }[]> = {
  5: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 45500, hours: "근무 5h", avatarColor: "#5C4033", payday: false, overtime: "연장 1h" },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  6: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 40000, hours: "근무 5h", avatarColor: "#5C4033", payday: false },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 60000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false, weekly: "주휴 발생" },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  8: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 40000, hours: "근무 5h", avatarColor: "#5C4033", payday: false },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 69000, hours: "근무 6h", avatarColor: "#C0392B", payday: false, night: "야간 30m" },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  10: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 45000, hours: "근무 5h", avatarColor: "#5C4033", payday: true, incentive: "인센티브" },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: true },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  13: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 50000, hours: "근무 5h", avatarColor: "#5C4033", payday: false, overtime: "연장 1h 12m", incentive: "인센티브" },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  20: [
    { name: "김정민", shift: "오픈", type: "정규직", amount: 50000, hours: "근무 5h", avatarColor: "#5C4033", payday: false, overtime: "연장 1h 30m", weekly: "주휴 발생" },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
    { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  ],
  31: [
    { name: "가나디", shift: "미들", type: "알바생", amount: 880000, hours: "근무 4h 30m", avatarColor: "#5C4033", payday: true },
    { name: "김정민", shift: "오픈", type: "정규직", amount: 50000, hours: "근무 5h", avatarColor: "#5C4033", payday: false },
    { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
    { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
  ],
};
const DAILY_STAFF_DEFAULT = [
  { name: "김정민", shift: "오픈", type: "정규직", amount: 50000, hours: "근무 5h", avatarColor: "#5C4033", payday: false },
  { name: "문자영", shift: "오픈, 미들", type: "알바생", amount: 66000, hours: "근무 6h", avatarColor: "#C0392B", payday: false },
  { name: "정수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#1ABC9C", payday: false },
  { name: "김수민", shift: "미들", type: "알바생", amount: 52000, hours: "근무 4h 30m", avatarColor: "#2C3E50", payday: false },
  { name: "박지훈", shift: "마감", type: "알바생", amount: 48000, hours: "근무 4h", avatarColor: "#27AE60", payday: false },
  { name: "이클립스", shift: "마감", type: "정규직", amount: 55000, hours: "근무 5h 30m", avatarColor: "#8E44AD", payday: false },
];

const WEEKLY_STAFF = [
  { name: "정수민", shift: "오픈", type: "알바생", hours: "08:00 - 13:00", amount: 50195 },
  { name: "정수민", shift: "미들", type: "알바생", hours: "08:00 - 13:00", amount: 50195 },
  { name: "정수민", shift: "미들", type: "알바생", hours: "08:00 - 13:00", amount: 50195 },
];

function formatSalary(n: number) {
  if (n >= 10000) { const man = (n / 10000).toFixed(1).replace(/\.0$/, ""); return `${man}만`; }
  return n.toLocaleString();
}
function formatExtra(n: number) {
  if (n >= 10000) { const man = (n / 10000).toFixed(1).replace(/\.0$/, ""); return `${man}만`; }
  const chun = Math.round(n / 1000);
  return `${chun}천`;
}

export default function SalaryManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"급여 캘린더" | "급여명세서 발급">(searchParams.get("tab") === "payslip" ? "급여명세서 발급" : "급여 캘린더");
  const [dismissedBanners, setDismissedBanners] = useState<Set<number>>(new Set());
  const [salaryFilter, setSalaryFilter] = useState<"전체 직원 급여" | "직원 선택하기">("전체 직원 급여");
  const [viewMode, setViewMode] = useState<"월간" | "주간">("월간");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 22));
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<typeof STAFF_LIST[0] | null>(() => {
    const staffParam = searchParams.get('staff');
    return staffParam ? STAFF_LIST.find(s => s.name === staffParam) || null : null;
  });
  const [individualDaySheetOpen, setIndividualDaySheetOpen] = useState(false);
  const [deductOpen, setDeductOpen] = useState(false);

  const isAnySheetOpen = bottomSheetOpen || staffPickerOpen || individualDaySheetOpen || monthPickerOpen;
  useEffect(() => {
    if (isAnySheetOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isAnySheetOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [pickerYear, setPickerYear] = useState(year);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const isPayday = CALENDAR_PAYDAY_DATA.some(s =>
      s.payDay.split(',').map(p => { const t = p.trim(); return t === '말일' ? lastDayOfMonth : parseInt(t); }).includes(day)
    );
    setSelectedDay(d);
    if (selectedStaff) {
      if (!STAFF_INDIVIDUAL_SALARY[day]) return;
      setIndividualDaySheetOpen(true);
    } else {
      setBottomSheetOpen(true);
    }
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: { day: number; isOutside: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) { cells.push({ day: prevMonthDays - i, isOutside: true }); }
  for (let d = 1; d <= daysInMonth; d++) { cells.push({ day: d, isOutside: false }); }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) { for (let i = 1; i <= remaining; i++) { cells.push({ day: i, isOutside: true }); } }
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) { weeks.push(cells.slice(i, i + 7)); }

  const dayOfWeek = currentDate.getDay();
  const sunday = new Date(currentDate);
  sunday.setDate(currentDate.getDate() - dayOfWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d; });
  const isSelectedWeekDay = (d: Date) => d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth() && d.getDate() === currentDate.getDate();
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const totalSalary = 3400500;
  const displayStaff = expanded ? STAFF_SALARY : STAFF_SALARY.slice(0, 3);
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate('/owner/home')} className="pressable p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여 관리</h1>
          </div>
          <div className="flex border-b border-border px-5" style={{ gap: '36px' }}>
            {(["급여 캘린더", "급여명세서 발급"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative whitespace-nowrap"
                style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* 급여일 D-day 배너 */}
        {(() => {
          const today = new Date();
          const todayDate = today.getDate();
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

          const unpaidStaff = PAYSLIP_STAFF_LIST.filter(s => s.status === "지급 전");
          if (unpaidStaff.length === 0) return null;

          const parsedDays = unpaidStaff.flatMap(s =>
            s.payDay.split(',').map(d => {
              const t = d.trim();
              if (t === '말일') return lastDay;
              return parseInt(t);
            }).filter(n => !isNaN(n))
          );
          const uniqueDays = [...new Set(parsedDays)].sort((a, b) => {
            const da = a >= todayDate ? a - todayDate : a + lastDay - todayDate;
            const db = b >= todayDate ? b - todayDate : b + lastDay - todayDate;
            return da - db;
          });

          if (uniqueDays.length === 0) return null;

          const allBanners = uniqueDays.map(day => {
            const dDay = day >= todayDate ? day - todayDate : day + lastDay - todayDate;
            const affectedStaff = unpaidStaff.filter(s =>
              s.payDay.split(',').map(d => {
                const t = d.trim();
                if (t === '말일') return lastDay;
                return parseInt(t);
              }).includes(day)
            );
            if (affectedStaff.length === 0) return null;
            return { dDay, day, affectedStaff, totalAmt: affectedStaff.reduce((sum, s) => sum + s.amount, 0) };
          }).filter(Boolean) as { dDay: number; day: number; affectedStaff: typeof unpaidStaff; totalAmt: number }[];

          // dDay 기준 중복 제거 (오늘=0, 내일=1 각 1건만)
          const seenDDay = new Set<number>();
          const banners = allBanners.filter(b => {
            if (seenDDay.has(b.dDay)) return false;
            seenDDay.add(b.dDay);
            return true;
          });

          const visibleBanners = banners.filter(b => !dismissedBanners.has(b.day));
          if (visibleBanners.length === 0) return null;

          const b = visibleBanners[0];
          const isTodayPayday = b.dDay === 0;
          const bgColor = isTodayPayday ? '#FF3D3D' : '#FF8F00';
          const bgLight = isTodayPayday ? '#FFF0F0' : '#FFF8EC';
          const textColor = isTodayPayday ? '#FF3D3D' : '#FF8F00';
          const emoji = isTodayPayday ? '💸' : '⏰';
          const label = isTodayPayday ? '오늘이 급여일이에요!' : '내일이 급여일이에요!';
          const desc = isTodayPayday ? '급여 명세서를 발급해주세요' : '급여 명세서를 확인해주세요';
          const sub = `${b.affectedStaff.length}명 · ${b.totalAmt.toLocaleString()}원 지급 예정`;

          return (
            <div style={{ margin: '12px 20px 0', backgroundColor: bgLight, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '18px' }}>{emoji}</span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: textColor, margin: 0, letterSpacing: '-0.02em' }}>{label}</p>
                  <p style={{ fontSize: '13px', color: '#70737B', margin: '1px 0 0', letterSpacing: '-0.02em' }}>{desc}</p>
                  
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab("급여명세서 발급")}
                  style={{ height: '32px', padding: '0 12px', borderRadius: '8px', backgroundColor: bgColor, border: 'none', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', flexShrink: 0, letterSpacing: '-0.02em' }}>
                  명세서 보기
                </button>
                <button
                  onClick={() => setDismissedBanners(prev => new Set([...prev, b.day]))}
                  style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.45 }}>
                  <X style={{ width: '14px', height: '14px', color: textColor }} />
                </button>
              </div>
            </div>
          );
        })()}

        {activeTab === "급여 캘린더" && (
          <div className="flex flex-col">
            {/* Filter chips */}
            <div className="flex px-5 py-3 overflow-x-auto scrollbar-hide" style={{ gap: '8px' }}>
              <button onClick={() => { setSalaryFilter("전체 직원 급여"); setSelectedStaff(null); }} className="pressable"
                style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: salaryFilter === "전체 직원 급여" && !selectedStaff ? '#E8F3FF' : '#FFFFFF', color: salaryFilter === "전체 직원 급여" && !selectedStaff ? '#4261FF' : '#AAB4BF', border: `1px solid ${salaryFilter === "전체 직원 급여" && !selectedStaff ? '#4261FF' : '#DBDCDF'}` }}>
                전체 직원 급여
              </button>
              {selectedStaff ? (
                <button className="pressable flex items-center gap-1" onClick={() => { setSelectedStaff(null); setSalaryFilter("전체 직원 급여"); }}
                  style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: '#E8F3FF', color: '#4261FF', border: '1px solid #4261FF' }}>
                  {selectedStaff.name} <X className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={() => { setSalaryFilter("직원 선택하기"); setStaffPickerOpen(true); }} className="pressable"
                  style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: '#FFFFFF', color: '#AAB4BF', border: '1px solid #DBDCDF' }}>
                  직원 선택하기
                </button>
              )}
            </div>

            {!HAS_DATA ? (
              <div className="mx-5 bg-muted rounded-2xl py-12 flex flex-col items-center gap-3">
                <p className="text-[14px] text-muted-foreground text-center leading-relaxed">직원을 추가하고 근무를 시작하면<br />급여가 자동으로 계산돼요</p>
                <button className="px-5 py-2.5 rounded-full border border-primary text-primary text-[14px] font-medium">+ 직원 추가하기</button>
              </div>
            ) : selectedStaff ? (
              /* Individual staff salary card */
              <div style={{ margin: '4px 20px 0', borderRadius: '16px', backgroundColor: '#F0F7FF' }}>
                <div style={{ padding: '16px' }}>
                  {/* 직원 프로필 */}
                  <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-bold" style={{ backgroundColor: selectedStaff.avatarColor }}>
                      {selectedStaff.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>{selectedStaff.name}</span>
                        {selectedStaff.shifts.map((sh) => (
                          <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sh === "오픈" ? "bg-shift-open-bg text-shift-open" : sh === "미들" ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>{sh}</span>
                        ))}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{selectedStaff.type}</span>
                        <button onClick={() => setStaffPickerOpen(true)} className="p-0.5"><ChevronDown className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span style={{ fontSize: '13px', color: '#70737B' }}>근무일 {selectedStaff.workDays}</span>
                        <span style={{ fontSize: '13px', color: '#70737B' }}>
                          {selectedStaff.salaryType === "시급" ? `시급 ${(selectedStaff as any).hourlyWage.toLocaleString()}원`
                            : selectedStaff.salaryType === "월급" ? `월급 ${(selectedStaff as any).monthlyWage.toLocaleString()}원`
                            : `연봉 ${((selectedStaff as any).annualWage / 10000).toFixed(0)}만원`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', marginBottom: '12px' }} />

                  {/* 예상 급여 요약 */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, color: '#7488FE', marginBottom: '8px' }}>
                    *{month + 1}/1 ~ {month + 1}/21 기준 예상 급여
                  </span>
                  <div className="flex items-center justify-between" style={{ marginTop: '4px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B' }}>{month + 1}월 예상 지급액</p>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#4261FF' }}>{selectedStaff.salary.totalPay.toLocaleString()}원</span>
                  </div>
                  <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '12px 0' }} />

                  {/* 급여 구성 항목 */}
                  <div className="space-y-2" style={{ marginBottom: '12px' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: '#AAB4BF' }}>근무 시간</span>
                      <span style={{ fontSize: '14px', color: '#19191B' }}>
                        {selectedStaff.salary.workHours}
                        {selectedStaff.salary.overtime && <span style={{ color: '#FF862D' }}> ({selectedStaff.salary.overtime})</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '14px', color: '#AAB4BF' }}>기본 급여</span>
                      <span style={{ fontSize: '14px', color: '#19191B' }}>{selectedStaff.salary.basePay.toLocaleString()}원</span>
                    </div>
                    {selectedStaff.salary.overtimePay > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#FF862D', fontWeight: 600 }}>연장 수당</span>
                        <span style={{ fontSize: '14px', color: '#FF862D', fontWeight: 600 }}>+{selectedStaff.salary.overtimePay.toLocaleString()}원</span>
                      </div>
                    )}
                    {selectedStaff.salary.weeklyPay > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#213DD9', fontWeight: 600 }}>주휴 수당</span>
                        <span style={{ fontSize: '14px', color: '#213DD9', fontWeight: 600 }}>+{selectedStaff.salary.weeklyPay.toLocaleString()}원</span>
                      </div>
                    )}
                    {selectedStaff.salary.nightPay > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#6B4FEC', fontWeight: 600 }}>야간 수당</span>
                        <span style={{ fontSize: '14px', color: '#6B4FEC', fontWeight: 600 }}>+{selectedStaff.salary.nightPay.toLocaleString()}원</span>
                      </div>
                    )}
                    {selectedStaff.salary.holidayPay > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#E05C00', fontWeight: 600 }}>휴일 수당</span>
                        <span style={{ fontSize: '14px', color: '#E05C00', fontWeight: 600 }}>+{selectedStaff.salary.holidayPay.toLocaleString()}원</span>
                      </div>
                    )}
                    {selectedStaff.salary.incentive > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#10C97D', fontWeight: 600 }}>기타 인센티브</span>
                        <span style={{ fontSize: '14px', color: '#10C97D', fontWeight: 600 }}>+{selectedStaff.salary.incentive.toLocaleString()}원</span>
                      </div>
                    )}
                  </div>

                  {/* 세금 공제 항목 */}
                  {(() => {
                    const d = selectedStaff.salary.deductions;
                    const incomeTaxTotal = d.incomeTax + d.localTax;
                    const insuranceTotal = d.nationalPension + d.healthInsurance + d.longTermCare + d.employmentInsurance;
                    const total = incomeTaxTotal + insuranceTotal;
                    return (
                      <>
                        {/* 구분선 */}
                        <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '4px 0 12px' }} />

                        {/* 세금 공제 타이틀 행 */}
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#19191B' }}>세금 공제</span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FF3D3D' }}>-{total.toLocaleString()}원</span>
                        </div>

                        {/* 요약 2줄 — 소득세 / 4대보험 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: deductOpen ? '8px' : '0' }}>
                          {incomeTaxTotal > 0 && (
                            <div className="flex items-center justify-between">
                              <span style={{ fontSize: '14px', color: '#AAB4BF' }}>소득세</span>
                              <span style={{ fontSize: '14px', color: '#70737B' }}>-{incomeTaxTotal.toLocaleString()}원</span>
                            </div>
                          )}
                          {insuranceTotal > 0 && (
                            <div className="flex items-center justify-between">
                              <span style={{ fontSize: '14px', color: '#AAB4BF' }}>4대 보험</span>
                              <span style={{ fontSize: '14px', color: '#70737B' }}>-{insuranceTotal.toLocaleString()}원</span>
                            </div>
                          )}
                        </div>

                        {/* 더보기 펼친 상태 — 상세 항목 */}
                        {deductOpen && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                            {incomeTaxTotal > 0 && (
                              <>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#70737B' }}>소득세</span>
                                {d.incomeTax > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>소득세</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.incomeTax.toLocaleString()}원</span>
                                  </div>
                                )}
                                {d.localTax > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>지방소득세</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.localTax.toLocaleString()}원</span>
                                  </div>
                                )}
                              </>
                            )}
                            {incomeTaxTotal > 0 && insuranceTotal > 0 && (
                              <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '2px 0' }} />
                            )}
                            {insuranceTotal > 0 && (
                              <>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#70737B' }}>4대 보험</span>
                                {d.nationalPension > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>국민연금</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.nationalPension.toLocaleString()}원</span>
                                  </div>
                                )}
                                {d.healthInsurance > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>건강보험</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.healthInsurance.toLocaleString()}원</span>
                                  </div>
                                )}
                                {d.longTermCare > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>장기요양보험</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.longTermCare.toLocaleString()}원</span>
                                  </div>
                                )}
                                {d.employmentInsurance > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '13px', color: '#AAB4BF' }}>고용보험</span>
                                    <span style={{ fontSize: '13px', color: '#70737B' }}>-{d.employmentInsurance.toLocaleString()}원</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* 더보기 버튼 */}
                        <button onClick={() => setDeductOpen(v => !v)} className="pressable w-full flex items-center justify-center gap-1" style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#70737B' }}>
                          {deductOpen ? '닫기' : '더보기'}
                          {deductOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* Salary summary card */
              <div style={{ margin: '4px 20px 0', borderRadius: '16px', backgroundColor: '#F0F7FF' }}>
                <div style={{ padding: '16px 16px 0 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#7488FE' }}>
                    *{month + 1}월 1일 ~ 21일 기준 미지급 급여 합계
                  </span>
                  <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{month + 1}월 예상 총 급여</p>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF' }}>{totalSalary.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '12px 16px' }} />
                <div style={{ padding: '0 16px 16px 16px' }}>
                  {displayStaff.map((s, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ marginBottom: i < displayStaff.length - 1 ? '10px' : '0' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: s.status === "지급 전" ? '#ECFFF1' : '#F7F7F8', color: s.status === "지급 전" ? '#1EDC83' : '#AAB4BF' }}>{s.status === "지급 전" ? "미발급" : "발급 완료"}</span>
                        <span style={{ fontSize: '14px', color: s.status === "지급 완료" ? '#AAB4BF' : '#19191B' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', color: s.status === "지급 완료" ? '#AAB4BF' : '#19191B' }}>{s.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                  <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center gap-1 text-[13px] text-muted-foreground" style={{ marginTop: '12px' }}>
                    {expanded ? "닫기" : "더보기"}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Calendar section */}
            <div className="mt-0 bg-card pt-4 pb-2">
              <div className="w-full h-[12px]" style={{ backgroundColor: '#F7F7F8' }} />
              <div className="flex items-center justify-between px-5" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <div className="flex items-center gap-1">
                  <button onClick={viewMode === "월간" ? prevMonth : prevWeek} className="pressable p-1"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
                  <button onClick={() => { setPickerYear(year); setMonthPickerOpen(true); }} className="flex items-center gap-1">
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{year}년 {month + 1}월</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={viewMode === "월간" ? nextMonth : nextWeek} className="pressable p-1"><ChevronRight className="w-5 h-5 text-foreground" /></button>
                </div>
                <div className="flex">
                  {(["월간", "주간"] as const).map((m) => (
                    <button key={m} onClick={() => setViewMode(m)}
                      style={{ width: '36px', height: '22px', fontSize: '12px', fontWeight: 600, letterSpacing: '-0.02em', borderRadius: m === "월간" ? '4px 0 0 4px' : '0 4px 4px 0', backgroundColor: viewMode === m ? '#93989E' : '#F7F7F8', color: viewMode === m ? '#FFFFFF' : '#93989E', border: 'none', cursor: 'pointer' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === "월간" ? (
                <div className="px-3">
                  <div className="grid grid-cols-7 text-center mb-2">
                    {DAY_LABELS.map((label, i) => (
                      <span key={label} className={`text-[13px] font-medium ${i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    ))}
                  </div>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 mb-1">
                      {week.map((cell, ci) => {
                        const isFuture = !cell.isOutside && new Date(year, month, cell.day) > today;
                        const salaryData = selectedStaff ? STAFF_INDIVIDUAL_SALARY : MONTHLY_SALARY;
                        const hasStaffData = !cell.isOutside && !isFuture && !!DAILY_STAFF_BY_DATE[cell.day];
                        const salary = !cell.isOutside && !isFuture && (selectedStaff ? !!STAFF_INDIVIDUAL_SALARY[cell.day] : hasStaffData) ? salaryData[cell.day] : null;
                        const isPayday = !cell.isOutside && PAYDAY.includes(cell.day);
                        const paydayStaffForCell = !cell.isOutside ? CALENDAR_PAYDAY_DATA.filter(s => {
                          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                          return s.payDay.split(',').map(d => { const t = d.trim(); return t === '말일' ? lastDayOfMonth : parseInt(t); }).includes(cell.day);
                        }) : [];
                        const allTransferred = paydayStaffForCell.length > 0 && paydayStaffForCell.every(s => s.transferred);
                        const isTodayCell = isToday(cell.day) && !cell.isOutside;
                        const isSun = ci === 0; const isSat = ci === 6;
                        const dateColor = cell.isOutside ? '#AAB4BF' : isTodayCell ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';
                        return (
                          <div key={ci} className="flex flex-col items-center py-1.5" style={{ minHeight: '72px' }}>
                            <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                              <button onClick={() => !cell.isOutside && handleDayClick(cell.day)} className="pressable"
                                style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isTodayCell ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : { minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }) }}>
                                {cell.day}
                              </button>
                            </div>
                            {salary && !cell.isOutside && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                {(() => {
                                  // 급여일(PAYDAY) 기준: 직전 급여일 다음날 ~ 급여일 당일 = 지급 예정(파랑)
                                  // 급여일 당일 다음날 ~ 다음 급여일 전 = 지급됨(회색)
                                  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                                  const resolvedPaydays = PAYDAY.map(p => p === 0 ? lastDayOfMonth : p).sort((a, b) => a - b);
                                  // cell.day 이하의 가장 가까운 급여일
                                  const lastPayday = resolvedPaydays.filter(p => p <= cell.day).pop();
                                  // 첫 번째 급여일(10일) 이하 = 이전달 급여 지급 후(회색)
                                  // 첫 번째 급여일 초과 = 다음 급여일까지 지급 전(파랑)
                                  const firstPayday = resolvedPaydays[0];
                                  const isPaidPeriod = cell.day <= firstPayday;
                                  const tagBg = isPaidPeriod ? '#F7F7F8' : '#EEF1FF';
                                  const tagColor = isPaidPeriod ? '#AAB4BF' : '#4261FF';
                                  return (
                                    <button onClick={() => handleDayClick(cell.day)} className="pressable"
                                      style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: tagBg, fontSize: '12px', fontWeight: isPaidPeriod ? 500 : 700, letterSpacing: '-0.02em', color: tagColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                                      {formatSalary(salary)}
                                    </button>
                                  );
                                })()}
                                {selectedStaff && (() => {
                                  const detail = STAFF_INDIVIDUAL_SALARY_DETAIL[cell.day];
                                  if (!detail) return null;
                                  const extras: { amt: number; color: string }[] = [];
                                  if (detail.overtime) extras.push({ amt: detail.overtime, color: '#FF862D' });
                                  if (detail.weekly) extras.push({ amt: detail.weekly, color: '#213DD9' });
                                  if (detail.night) extras.push({ amt: detail.night, color: '#6B4FEC' });
                                  if (detail.incentive) extras.push({ amt: detail.incentive, color: '#10C97D' });
                                  if (extras.length === 0) return null;
                                  return extras.map((e, ti) => (
                                    <button key={ti} onClick={() => handleDayClick(cell.day)} className="pressable"
                                      style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: e.color, fontSize: '11px', fontWeight: 600, letterSpacing: '-0.02em', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                      {formatExtra(e.amt)}
                                    </button>
                                  ));
                                })()}
                              </div>
                            )}
                            {isPayday && (
                              paydayStaffForCell.length > 0 ? (
                                allTransferred ? (
                                  // 지급 완료 — 초록 체크
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: salary ? '2px' : '0', flexShrink: 0, cursor: 'pointer' }} onClick={() => handleDayClick(cell.day)}>
                                    <circle cx="8" cy="8" r="7.5" fill="#10C97D"/>
                                    <polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ) : (
                                  // 지급 전 — 노란 동전 + 빨간 점
                                  <div style={{ position: 'relative', marginTop: salary ? '2px' : '0', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer' }} onClick={() => handleDayClick(cell.day)}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                      <circle cx="8" cy="8" r="7.5" fill="#FFB300"/>
                                      <circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/>
                                      <text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text>
                                    </svg>
                                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF3D3D', border: '1px solid #FFFFFF' }} />
                                  </div>
                                )
                              ) : (
                                // 급여일 데이터 없음 — 기본 동전
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: salary ? '2px' : '0', flexShrink: 0, cursor: 'pointer' }} onClick={() => handleDayClick(cell.day)}>
                                  <circle cx="8" cy="8" r="7.5" fill="#FFB300"/>
                                  <circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/>
                                  <text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text>
                                </svg>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-around px-5 pb-4">
                    {weekDays.map((d, i) => {
                      const selected = isSelectedWeekDay(d);
                      const isSun = i === 0; const isSat = i === 6;
                      const dayColor = isSun ? "text-destructive" : isSat ? "text-primary" : "text-muted-foreground";
                      const dateColor = isSun ? "text-destructive" : isSat ? "text-primary" : "text-foreground";
                      return (
                        <button key={i} className="flex flex-col items-center gap-1" onClick={() => setCurrentDate(new Date(d))}>
                          <span className={`text-[13px] ${selected ? "text-muted-foreground" : dayColor}`}>{DAY_LABELS[i]}</span>
                          <div className={`flex items-center justify-center rounded-2xl ${selected ? "bg-primary" : ""}`} style={{ width: 50, height: 54 }}>
                            <span className={`text-[15px] font-medium ${selected ? "text-primary-foreground" : dateColor}`}>{d.getDate()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-border">
                    {(() => {
                      const dateParam = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                      const dayStaff = DAILY_STAFF_BY_DATE[currentDate.getDate()] ?? [];
                      const allStaffData = selectedStaff
                        ? Object.entries(DAILY_STAFF_BY_DATE).flatMap(([, staffArr]) => staffArr.filter(s => s.name === selectedStaff.name))
                        : [];
                      const list = selectedStaff
                        ? dayStaff.filter(s => s.name === selectedStaff.name).length > 0
                          ? dayStaff.filter(s => s.name === selectedStaff.name)
                          : allStaffData.slice(0, 1).map(s => ({ ...s }))
                        : dayStaff;
                      if (list.length === 0) return (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                          <p style={{ fontSize: '14px', color: '#9EA3AD' }}>이 날은 급여 내역이 없어요</p>
                        </div>
                      );
                      return list.map((s, i) => (
                        <button key={i} className="w-full flex items-center justify-between px-5 py-4"
                          onClick={() => navigate(`/owner/salary/detail?name=${encodeURIComponent(s.name)}&date=${dateParam}`)}>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[14px] font-medium text-foreground">{s.name}</span>
                              {s.shift.split(", ").map(sh => (
                                <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sh === "오픈" ? "bg-shift-open-bg text-shift-open" : sh === "미들" ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>{sh}</span>
                              ))}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.type}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="text-[13px] text-muted-foreground">{s.hours} ㅣ {s.amount.toLocaleString()}원</span>
                              {(s as any).overtime && <span style={{ fontSize: '11px', fontWeight: 600, color: '#FF862D', backgroundColor: '#FFEEE2', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).overtime}</span>}
                              {(s as any).night && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B4FEC', backgroundColor: '#F1EFFD', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).night}</span>}
                              {(s as any).weekly && <span style={{ fontSize: '11px', fontWeight: 600, color: '#213DD9', backgroundColor: '#EDF3FF', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).weekly}</span>}
                              {(s as any).incentive && <span style={{ fontSize: '11px', fontWeight: 600, color: '#10C97D', backgroundColor: '#E5F9EC', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).incentive}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "급여명세서 발급" && <PayslipTab navigate={navigate} />}
      </div>

      {/* Day detail bottom sheet */}
      {bottomSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setBottomSheetOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {selectedDay && `${selectedDay.getFullYear()}년 ${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일 (${DAY_LABELS[selectedDay.getDay()]})`}
                  </h3>
                  {selectedDay && PAYDAY.includes(selectedDay.getDate()) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '22px', borderRadius: '6px', padding: '0 8px', backgroundColor: '#FFF8E1', border: '1px solid #FFB300' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#FFB300" stroke="#F59E0B" strokeWidth="0.5"/><circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/><text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text></svg>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#B8860B' }}>급여일</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setBottomSheetOpen(false)} className="pressable p-1"><X className="w-5 h-5 text-foreground" /></button>
              </div>
              <p style={{ fontSize: '14px', color: '#AAB4BF', marginBottom: '4px' }}>총 예상 급여</p>
              <p style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', marginBottom: '16px' }}>451,000원</p>
              <div style={{ height: '0.5px', backgroundColor: '#AAB4BF', marginBottom: '12px' }} />
              {selectedDay && (() => {
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const isCalendarPayday = CALENDAR_PAYDAY_DATA.some(s =>
                  s.payDay.split(',').map(d => { const t = d.trim(); return t === '말일' ? lastDayOfMonth : parseInt(t); }).includes(selectedDay.getDate())
                );
                if (!isCalendarPayday) return null;
                const paydayStaff = (DAILY_STAFF_BY_DATE[selectedDay.getDate()] ?? []).filter(s => s.payday);
                if (paydayStaff.length === 0) return null;
                const allTransferred = CALENDAR_PAYDAY_DATA.filter(s =>
                  s.payDay.split(',').map(d => { const t = d.trim(); return t === '말일' ? lastDayOfMonth : parseInt(t); }).includes(selectedDay.getDate())
                ).every(s => s.transferred);
                const names = paydayStaff.length <= 2 ? paydayStaff.map(s => s.name).join(', ') : `${paydayStaff[0].name} 외 ${paydayStaff.length - 1}명`;
                return allTransferred ? (
                  <div style={{ backgroundColor: 'rgba(16,201,125,0.08)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="7.5" fill="#10C97D"/><polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: '13px', color: '#065F46', fontWeight: 500 }}><span style={{ fontWeight: 700 }}>{names}</span> 직원 급여 명세서 발급 완료</span>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FFF8E1', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="7.5" fill="#FFB300" stroke="#F59E0B" strokeWidth="0.5"/><circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/><text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text></svg>
                    <span style={{ fontSize: '13px', color: '#92400E', fontWeight: 500 }}><span style={{ fontWeight: 700 }}>{names}</span> 직원의 급여일이에요</span>
                  </div>
                );
              })()}
              <div className="flex items-center justify-between" style={{ marginBottom: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>근무직원</span>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 {(selectedDay ? (DAILY_STAFF_BY_DATE[selectedDay.getDate()] ?? []) : []).length}명</span>
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-[10px]" style={{ maxHeight: '272px' }}>
              <div className="space-y-0">
                {selectedDay && !(DAILY_STAFF_BY_DATE[selectedDay.getDate()] ?? []).length && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: '14px', color: '#9EA3AD' }}>이 날은 급여 내역이 없어요</p>
                  </div>
                )}
                {((() => {
                  const raw = selectedDay ? (DAILY_STAFF_BY_DATE[selectedDay.getDate()] ?? []) : [];
                  return [...raw].sort((a, b) => {
                    const aPub = PAYSLIP_HISTORY.some(h => h.name === a.name && h.status === "지급 완료") || !!localStorage.getItem(`payslip_published_${a.name}`);
                    const bPub = PAYSLIP_HISTORY.some(h => h.name === b.name && h.status === "지급 완료") || !!localStorage.getItem(`payslip_published_${b.name}`);
                    if (aPub !== bPub) return aPub ? 1 : -1;
                    return a.name.localeCompare(b.name, 'ko');
                  });
                })()).map((s, i) => (
                  <button key={i} className="w-full flex items-center justify-between pressable py-[10px]"
                    onClick={() => {
                      setBottomSheetOpen(false);
                      const dateParam = selectedDay ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}` : '';
                      const lastDayOfMonthBS = new Date(year, month + 1, 0).getDate();
                      const firstPaydayBS = PAYDAY.map(p => p === 0 ? lastDayOfMonthBS : p).sort((a, b) => a - b)[0];
                      const isPaidBS = (selectedDay?.getDate() ?? 0) <= firstPaydayBS;
                      navigate(`/owner/salary/detail?name=${encodeURIComponent(s.name)}&date=${dateParam}${isPaidBS ? '&paid=true' : ''}&from=all`);
                    }}>
                    <div className="flex items-center gap-3">
                      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: s.avatarColor }}>{s.name.charAt(0)}</div>
                        {s.payday && selectedDay && PAYDAY.includes(selectedDay.getDate()) && (
                          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px' }}>
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="7.5" fill="#FFB300"/>
                              <circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/>
                              <text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#19191B' }}>{s.name}</span>
                          {s.shift.split(", ").map((sh) => (<span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sh === "오픈" ? "bg-shift-open-bg text-shift-open" : sh === "미들" ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>{sh}</span>))}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.type}</span>
                          {(() => {
                            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                            const resolvedPaydays = PAYDAY.map(p => p === 0 ? lastDayOfMonth : p).sort((a, b) => a - b);
                            const firstPayday = resolvedPaydays[0];
                            const selectedDate = selectedDay?.getDate() ?? 0;
                            const isPaidPeriod = selectedDate <= firstPayday;
                            return isPaidPeriod
                              ? <span style={{ fontSize: '10px', fontWeight: 700, color: '#AAB4BF', backgroundColor: '#F7F7F8', border: '1px solid #DBDCDF', borderRadius: '4px', padding: '1px 5px' }}>발급 완료</span>
                              : <span style={{ fontSize: '10px', fontWeight: 700, color: '#1EDC83', backgroundColor: '#ECFFF1', border: '1px solid #1EDC83', borderRadius: '4px', padding: '1px 5px' }}>미발급</span>;
                          })()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{s.amount.toLocaleString()}원 ㅣ {s.hours}</span>
                          {(s as any).overtime && <span style={{ fontSize: '11px', fontWeight: 600, color: '#FF862D', backgroundColor: '#FFEEE2', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).overtime}</span>}
                          {(s as any).night && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B4FEC', backgroundColor: '#F1EFFD', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).night}</span>}
                          {(s as any).weekly && <span style={{ fontSize: '11px', fontWeight: 600, color: '#213DD9', backgroundColor: '#EDF3FF', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).weekly}</span>}
                          {(s as any).incentive && <span style={{ fontSize: '11px', fontWeight: 600, color: '#10C97D', backgroundColor: '#E5F9EC', borderRadius: '4px', padding: '1px 5px' }}>{(s as any).incentive}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Month Picker Overlay */}
      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
          <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setPickerYear(pickerYear - 1)} className="pressable p-1"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => setPickerYear(pickerYear + 1)} className="pressable p-1"><ChevronRight className="w-5 h-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const isSelected = pickerYear === year && i === month;
                return (
                  <button key={i} onClick={() => { setCurrentDate(new Date(pickerYear, i, 1)); setMonthPickerOpen(false); }} className="pressable py-2.5 rounded-xl text-[14px] font-medium"
                    style={{ backgroundColor: isSelected ? '#4261FF' : '#F7F7F8', color: isSelected ? '#FFFFFF' : '#19191B' }}>
                    {i + 1}월
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Staff Picker Bottom Sheet */}
      {staffPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setStaffPickerOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", color: "#19191B" }}>직원 선택하기</h3>
                <button onClick={() => setStaffPickerOpen(false)} className="pressable p-1"><X className="w-5 h-5 text-foreground" /></button>
              </div>
              <div className="flex items-center justify-between" style={{ marginBottom: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>근무직원</span>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 {STAFF_LIST.length}명</span>
              </div>
            </div>
            <div className="overflow-y-auto py-[10px]" style={{ maxHeight: '60vh' }}>
              {STAFF_LIST.map((staff, i) => (
                <button key={i} onClick={() => { setSelectedStaff(staff); setSalaryFilter("직원 선택하기"); setStaffPickerOpen(false); }}
                  className="pressable w-full flex items-center justify-between px-6 py-[10px]"
                  style={{ backgroundColor: selectedStaff?.name === staff.name ? '#F0F4FF' : '#FFFFFF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: staff.avatarColor }}>{staff.name.charAt(0)}</div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: selectedStaff?.name === staff.name ? '#4261FF' : '#19191B' }}>{staff.name}</span>
                        {staff.shifts.map((sh) => (<span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sh === "오픈" ? "bg-shift-open-bg text-shift-open" : sh === "미들" ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>{sh}</span>))}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{staff.type}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{staff.workDays}</span>
                    </div>
                  </div>
                  {selectedStaff?.name === staff.name && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4261FF', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Individual staff day detail bottom sheet */}
      {individualDaySheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setIndividualDaySheetOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-8">
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {selectedDay && `${selectedDay.getFullYear()}년 ${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일 (${DAY_LABELS[selectedDay.getDay()]})`}
                  </h3>
                  {selectedDay && PAYDAY.includes(selectedDay.getDate()) && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '22px', borderRadius: '6px', padding: '0 8px', backgroundColor: '#FFF8E1', border: '1px solid #FFB300' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#FFB300" stroke="#F59E0B" strokeWidth="0.5"/><circle cx="8" cy="8" r="5.5" fill="#FFCA28" opacity="0.6"/><text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#92400E" fontFamily="system-ui">₩</text></svg>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#B8860B' }}>급여일</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setIndividualDaySheetOpen(false)} className="pressable p-1"><X className="w-5 h-5 text-foreground" /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <p style={{ fontSize: '14px', color: '#AAB4BF', margin: 0 }}>08:00 - 13:00 <span style={{ color: '#AAB4BF' }}>(휴게 30분)</span></p>
                {(() => {
                  const lastDayOfMonth2 = new Date(year, month + 1, 0).getDate();
                  const firstPayday2 = PAYDAY.map(p => p === 0 ? lastDayOfMonth2 : p).sort((a, b) => a - b)[0];
                  const selectedDate2 = selectedDay?.getDate() ?? 0;
                  const isPaidPeriod2 = selectedDate2 <= firstPayday2;
                  return isPaidPeriod2
                    ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BF', backgroundColor: '#F7F7F8', border: '1px solid #DBDCDF', borderRadius: '4px', padding: '1px 5px' }}>발급 완료</span>
                    : <span style={{ fontSize: '11px', fontWeight: 700, color: '#1EDC83', backgroundColor: '#ECFFF1', border: '1px solid #1EDC83', borderRadius: '4px', padding: '1px 5px' }}>미발급</span>;
                })()}
              </div>
              <p style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', marginBottom: '16px' }}>50,195원</p>
              <div style={{ height: '0.5px', backgroundColor: '#AAB4BF', marginBottom: '16px' }} />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 근무 시간</span>
                  <span style={{ fontSize: '14px', color: '#19191B' }}>4h <span style={{ color: '#4261FF' }}>(+10m)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '14px', color: '#AAB4BF' }}>기본 급여</span>
                  <span style={{ fontSize: '14px', color: '#19191B' }}>48,362원</span>
                </div>
                {selectedStaff && selectedDay && (() => {
                  const detail = STAFF_INDIVIDUAL_SALARY_DETAIL[selectedDay.getDate()];
                  if (!detail) return null;
                  return (<>
                    {detail.overtime && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#FF862D', fontWeight: 600 }}>연장 수당</span>
                        <span style={{ fontSize: '14px', color: '#FF862D', fontWeight: 600 }}>+{detail.overtime.toLocaleString()}원</span>
                      </div>
                    )}
                    {detail.weekly && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#213DD9', fontWeight: 600 }}>주휴 수당</span>
                        <span style={{ fontSize: '14px', color: '#4261FF', fontWeight: 600 }}>+{detail.weekly.toLocaleString()}원</span>
                      </div>
                    )}
                    {detail.night && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#6B4FEC', fontWeight: 600 }}>야간 수당</span>
                        <span style={{ fontSize: '14px', color: '#6B4FEC', fontWeight: 600 }}>+{detail.night.toLocaleString()}원</span>
                      </div>
                    )}
                    {detail.holiday && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#E05C00', fontWeight: 600 }}>휴일 수당</span>
                        <span style={{ fontSize: '14px', color: '#E05C00', fontWeight: 600 }}>+{detail.holiday.toLocaleString()}원</span>
                      </div>
                    )}
                    {detail.incentive && (
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: '#10C97D', fontWeight: 600 }}>기타 인센티브</span>
                        <span style={{ fontSize: '14px', color: '#10C97D', fontWeight: 600 }}>+{detail.incentive.toLocaleString()}원</span>
                      </div>
                    )}
                  </>);
                })()}
              </div>
              <button
                style={{ width: '100%', marginTop: '24px', height: '52px', borderRadius: '14px', backgroundColor: '#4261FF', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                onClick={() => {
                  setIndividualDaySheetOpen(false);
                  const dateParam = selectedDay ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}` : '';
                  const lastDayOfMonth3 = new Date(year, month + 1, 0).getDate();
                  const firstPayday3 = PAYDAY.map(p => p === 0 ? lastDayOfMonth3 : p).sort((a, b) => a - b)[0];
                  const isPaid3 = (selectedDay?.getDate() ?? 0) <= firstPayday3;
                  navigate(`/owner/salary/detail?name=${encodeURIComponent(selectedStaff?.name || '')}&date=${dateParam}${isPaid3 ? '&paid=true' : ''}`);
                }}>
                급여 상세보기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
