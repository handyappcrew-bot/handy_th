import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Copy, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffStore, StaffData } from "@/lib/staffStore";

type ShiftType = "오픈" | "미들" | "마감";

const SHIFT_BADGE_STYLES: Record<ShiftType, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

function Divider() {
  return <div style={{ height: '12px', backgroundColor: '#F7F7F8' }} />;
}

function InfoRow({ label, children, mb }: { label: string; children: React.ReactNode; mb?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: mb ? `${mb}px` : '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1 }}>{children}</span>
    </div>
  );
}

function SectionHeader({ title, onEdit, isRegistered = true, readonly = false }: { title: string; onEdit: () => void; isRegistered?: boolean; readonly?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B' }}>{title}</h3>
      {!readonly && (
        <button onClick={onEdit} className="pressable"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: isRegistered ? '#70737B' : '#4261FF' }}>{isRegistered ? '수정하기' : '등록하기'}</span>
          <ChevronRight style={{ width: '14px', height: '14px', color: isRegistered ? '#70737B' : '#4261FF' }} />
        </button>
      )}
    </div>
  );
}

export default function StaffDetail() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffData | undefined>(staffStore.getById(id || ""));
  useEffect(() => {
    setStaff(staffStore.getById(id || ""));
    return staffStore.subscribe(() => setStaff(staffStore.getById(id || "")));
  }, [id]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto flex items-center justify-center">
        <p className="text-muted-foreground">직원 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isPartTime = staff.employmentType === "알바생";
  const isGhost = staff.workStatus === "앱탈퇴";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "계좌번호가 복사되었습니다.", duration: 2000 });
  };

  const goEdit = (section: string) => {
    navigate(`/owner/staff/${staff.id}/edit?section=${encodeURIComponent(section)}`);
  };

  const location = useLocation();
  const [imagePreview, setImagePreview] = useState("");
  const [completionPopup, setCompletionPopup] = useState(false);
  const [tagVisible, setTagVisible] = useState(true);

  useEffect(() => {
    if (location.state?.flag === "completed") {
      setCompletionPopup(true);
      setTagVisible(false);
      // state 초기화 (뒤로가기 시 재노출 방지)
      window.history.replaceState({}, "");
    }
  }, []);

  const handleCompletionConfirm = () => {
    setCompletionPopup(false);
  };

  // 수습 비율 계산 노트 — 콜론이 여러 개일 수 있어서 첫 번째만 split
  const probationNote = (() => {
    if (!staff.probation || !staff.probationRate || !staff.salaryAmount) return "";
    const rate = parseFloat(staff.probationRate) / 100;
    const base = parseFloat(staff.salaryAmount.replace(/,/g, ""));
    if (isNaN(rate) || isNaN(base) || base <= 0) return "";
    const applied = Math.round(base * rate).toLocaleString();
    const formattedAmount = Number(staff.salaryAmount.replace(/,/g, '')).toLocaleString();
    return `*${staff.salaryType} ${formattedAmount}원의 ${staff.probationRate}: ${applied}원 적용`;
  })();

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 8px 8px' }}>
            <button onClick={() => navigate("/owner/staff")} className="pressable p-1">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>직원 정보 상세</h1>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 0' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ width: 'clamp(100px, 32vw, 120px)', height: 'clamp(100px, 32vw, 120px)', borderRadius: '50%', backgroundColor: isGhost ? '#B0B8C1' : staff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 700, color: '#FFFFFF', opacity: isGhost ? 0.7 : 1 }}>
              {staff.name.charAt(0)}
            </div>
            {staff.workStatus === '휴직' && (
              <span style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FF9800', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '2px 10px', whiteSpace: 'nowrap' }}>휴직</span>
            )}
            {staff.isNew && tagVisible && (
              <span style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '2px 10px', whiteSpace: 'nowrap' }}>신규 직원</span>
            )}
            {isGhost && (
              <span style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#70737B', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '2px 10px', whiteSpace: 'nowrap' }}>앱 탈퇴</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'clamp(12px, 4vw, 16px)', marginBottom: '20px' }}>
            <p style={{ fontSize: 'clamp(18px, 5.5vw, 20px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{staff.name}</p>
            {staff.workStatus === '휴직' && (
              <span style={{ backgroundColor: 'rgba(255,152,0,0.12)', color: '#FF9800', fontSize: '13px', fontWeight: 600, borderRadius: '6px', padding: '3px 8px', letterSpacing: '-0.02em' }}>휴직 중</span>
            )}
            {staff.isNew && tagVisible && (
              <span style={{ backgroundColor: 'rgba(66,97,255,0.1)', color: '#4261FF', fontSize: '13px', fontWeight: 600, borderRadius: '6px', padding: '3px 8px', letterSpacing: '-0.02em' }}>신규 직원</span>
            )}
            {isGhost && (
              <span style={{ backgroundColor: '#EAECEF', color: '#70737B', fontSize: '13px', fontWeight: 600, borderRadius: '6px', padding: '3px 8px', letterSpacing: '-0.02em' }}>앱 탈퇴</span>
            )}
          </div>
          {isGhost && (
            <div style={{ margin: '0 20px 20px', padding: '18px', backgroundColor: '#F4F5F7', borderRadius: '16px', border: '1px solid #C8CDD6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>👻</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#70737B', margin: 0 }}>이 직원은 앱을 탈퇴했어요</p>
              </div>
              <p style={{ fontSize: '13px', color: '#9EA3AD', margin: '0 0 14px 0', lineHeight: '1.6' }}>
                직원이 앱에서 탈퇴했지만 아직 퇴사 처리가 완료되지 않았어요.<br />
                미지급 급여나 계약 내역을 확인한 후 퇴사 처리를 해주세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { icon: '💸', text: '미지급 급여가 있는지 확인해주세요' },
                  { icon: '📋', text: '근로계약서 및 계약 내역을 보관해주세요' },
                  { icon: '✅', text: '확인 후 아래 근무 상태에서 퇴사 처리하세요' },
                ].map(({ icon, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>{icon}</span>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {staff.isNew && (() => {
            const steps = [
              { label: '고용 형태 · 급여 · 근무일', done: !!staff.salaryType },
              { label: '세금 항목', done: staff.incomeTax.some(t => t.active) || staff.socialInsurance.some(t => t.active) },
            ];
            const doneCount = steps.filter(s => s.done).length;
            const allDone = doneCount === steps.length;
            const progress = Math.round((doneCount / steps.length) * 100);
            return (
              <div style={{ margin: '4px 20px 20px', padding: '18px 18px', backgroundColor: '#F0F4FF', borderRadius: '16px', border: '1px solid rgba(66,97,255,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info style={{ width: '13px', height: '13px', color: '#4261FF', flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#4261FF', margin: 0 }}>
                      {allDone ? '등록 완료! 신규 직원 태그가 곧 사라져요' : `항목을 모두 등록하면 신규 직원 태그가 사라져요 (${doneCount}/${steps.length})`}
                    </p>
                  </div>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(66,97,255,0.15)', borderRadius: '99px', marginBottom: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#4261FF', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                </div>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < steps.length - 1 ? '6px' : '0' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, backgroundColor: s.done ? '#4261FF' : 'rgba(66,97,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.done && <Check style={{ width: '10px', height: '10px', color: '#FFFFFF' }} />}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: s.done ? '#4261FF' : '#9EA3AD', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <Divider />

        {/* 계약 정보 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="계약 정보" onEdit={() => goEdit('계약정보')} isRegistered={!!staff.salaryType} readonly={isGhost} />
          {!staff.salaryType ? (
            <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#F0F4FF', borderRadius: '12px', border: '1px dashed #4261FF' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#4261FF', margin: '0 0 4px 0' }}>계약 정보가 등록되지 않았어요</p>
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#70737B', margin: '0 0 12px 0', lineHeight: '1.5' }}>고용 형태 · 급여 · 근무일 정보를 등록해야<br />급여 계산과 일정 관리가 가능해요</p>
              <button onClick={() => goEdit('계약정보')}
                className="pressable"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '36px', paddingLeft: '14px', paddingRight: '14px', borderRadius: '8px', backgroundColor: '#4261FF', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                지금 계약 정보 등록하기 →
              </button>
            </div>
          ) : (
            <>
          <InfoRow label="입사일">{staff.hireDate ? `${staff.hireDate} (+${staff.hireDaysAgo}일)` : <span style={{ color: '#FF3D3D', fontWeight: 600 }}>입사일을 등록해주세요</span>}</InfoRow>
          <InfoRow label="고용 형태">{staff.employmentType || <span style={{ color: '#FF3D3D', fontWeight: 600 }}>고용 형태를 등록해주세요</span>}</InfoRow>

          {staff.salaryType ? (
            <>
              <InfoRow label="급여 형태">{staff.salaryType}</InfoRow>

              {staff.salaryType === '월급 (연봉 포함)' && (
                <InfoRow label="연봉 계약">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500, color: staff.isAnnualSalary ? '#10C97D' : '#93989E', backgroundColor: staff.isAnnualSalary ? 'rgba(16,201,125,0.1)' : '#F7F7F8', borderRadius: '4px', padding: '4px 10px' }}>
                    {staff.isAnnualSalary && <Check style={{ width: '14px', height: '14px' }} />}
                    {staff.isAnnualSalary ? '연봉 계약' : '미적용'}
                  </span>
                </InfoRow>
              )}

              {staff.isAnnualSalary ? (
                <InfoRow label="연봉">{Number((staff.annualSalary || "0").replace(/,/g, '')).toLocaleString()}원</InfoRow>
              ) : (
                staff.salaryAmount ? (
                  <>
                  <InfoRow label={staff.salaryType === '월급 (연봉 포함)' ? '월급' : staff.salaryType}>
                    {Number(staff.salaryAmount.replace(/,/g, '')).toLocaleString()}원
                  </InfoRow>
                  {staff.salaryType === '시급' && (
                    <InfoRow label="주휴">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500, color: staff.includeHolidayPay ? '#10C97D' : '#93989E', backgroundColor: staff.includeHolidayPay ? 'rgba(16,201,125,0.1)' : '#F7F7F8', borderRadius: '4px', padding: '4px 10px' }}>
                        {staff.includeHolidayPay && <Check style={{ width: '14px', height: '14px' }} />}
                        {staff.includeHolidayPay ? '주휴 포함' : '미적용'}
                      </span>
                    </InfoRow>
                  )}
                  <InfoRow label="휴게">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500, color: (staff as any).includeBreakTime ? '#10C97D' : '#93989E', backgroundColor: (staff as any).includeBreakTime ? 'rgba(16,201,125,0.1)' : '#F7F7F8', borderRadius: '4px', padding: '4px 10px' }}>
                      {(staff as any).includeBreakTime && <Check style={{ width: '14px', height: '14px' }} />}
                      {(staff as any).includeBreakTime ? `휴게 ${(staff as any).breakMinutes}분` : '미적용'}
                    </span>
                  </InfoRow>
                  </>
                ) : (
                  <InfoRow label={staff.salaryType === '월급 (연봉 포함)' ? '월급' : staff.salaryType}>
                    <button className="pressable" onClick={() => goEdit('계약정보')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #FF3D3D', cursor: 'pointer', background: 'none' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FF3D3D' }}>급여 미입력</span>
                      <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600, backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>입력하기 →</span>
                    </button>
                  </InfoRow>
                )
              )}

              {staff.salaryType === '시급' && staff.payCycle && (
                <InfoRow label="급여 지급 주기">{staff.payCycle}</InfoRow>
              )}

              <InfoRow label="급여일">{staff.payDay || <button className="pressable" onClick={() => goEdit('계약정보')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #FF3D3D', cursor: 'pointer', background: 'none' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#FF3D3D' }}>급여일 미등록</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600, backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>등록하기 →</span></button>}</InfoRow>
            </>
          ) : (
            <InfoRow label="급여 정보">
              <span style={{ color: '#FF3D3D', fontWeight: 600 }}>급여 정보를 등록해주세요</span>
            </InfoRow>
          )}

          {!staff.isNew && (
            <InfoRow label="수습">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500, color: staff.probation ? '#10C97D' : '#93989E', backgroundColor: staff.probation ? 'rgba(16,201,125,0.1)' : '#F7F7F8', borderRadius: '4px', padding: '4px 10px' }}>
                {staff.probation && <Check style={{ width: '14px', height: '14px' }} />}
                {staff.probation ? '수습 적용' : '미적용'}
              </span>
            </InfoRow>
          )}

          {staff.probation && staff.probationRate && (
            <>
              <InfoRow label="수습 비율">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>{staff.probationRate}</span>
                  {probationNote && (
                    <p style={{ fontSize: '14px', fontWeight: 400, margin: 0 }}>
                      <span style={{ color: '#70737B' }}>{probationNote.substring(0, probationNote.indexOf(':') + 1)}</span>
                      <span style={{ color: '#10C97D' }}>{probationNote.substring(probationNote.indexOf(':') + 1)}</span>
                    </p>
                  )}
                </div>
              </InfoRow>
              {(staff.probationStart || staff.probationEnd) && (
                <InfoRow label="수습 기간">{staff.probationStart || '-'} ~ {staff.probationEnd || '-'}</InfoRow>
              )}
            </>
          )}

          <InfoRow label="근무일" mb={16}>
            {staff.workSchedule.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {staff.workSchedule.map(ws => (
                  <div key={ws.day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B', width: '14px' }}>{ws.day}</span>
                    <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{ws.time}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {ws.shifts.map(s => (
                        <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE_STYLES[s as ShiftType]}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button className="pressable" onClick={() => goEdit('계약정보')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #FF3D3D', cursor: 'pointer', background: 'none' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#FF3D3D' }}>근무일 미등록</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600, backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>등록하기 →</span></button>
            )}
          </InfoRow>
            </>
          )}
        </div>

        <Divider />

        {/* 세금 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="세금" onEdit={() => goEdit('세금')} isRegistered={staff.incomeTax.some(t => t.active) || staff.socialInsurance.some(t => t.active)} readonly={isGhost} />
          {(() => {
            const activeIncome = staff.incomeTax.filter(t => t.active);
            const activeSocial = staff.socialInsurance.filter(t => t.active);
            const hasAny = activeIncome.length > 0 || activeSocial.length > 0;
            if (!hasAny) {
              return (
                <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#FFF8F0', borderRadius: '12px', border: '1px dashed #FFB347' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#FF8F00', margin: '0 0 4px 0' }}>세금 항목이 설정되지 않았어요</p>
                  <p style={{ fontSize: '13px', fontWeight: 400, color: '#70737B', margin: '0 0 12px 0', lineHeight: '1.5' }}>소득세·4대보험 항목을 설정하지 않으면<br />급여에서 세금이 공제되지 않아요</p>
                  <button onClick={() => goEdit('세금')}
                    className="pressable"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '36px', paddingLeft: '14px', paddingRight: '14px', borderRadius: '8px', backgroundColor: '#FF8F00', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    지금 세금 설정하기 →
                  </button>
                </div>
              );
            }
            return (
              <>
                <InfoRow label="소득세">
                  {activeIncome.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activeIncome.map(t => (
                        <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check style={{ width: '14px', height: '14px', color: '#10C97D', flexShrink: 0 }} />
                          <span style={{ fontSize: '16px', fontWeight: 500, color: '#70737B' }}>{t.label}</span>
                          <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{t.value}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button className="pressable" onClick={() => goEdit('세금')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FFF3F3', border: '1px dashed #FF3D3D', cursor: 'pointer', background: 'none' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FF3D3D' }}>소득세 항목 미설정</span>
                      <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600, backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>설정하기 →</span>
                    </button>
                  )}
                </InfoRow>
                {(!isPartTime || activeSocial.length > 0) && (
                  <InfoRow label="4대 보험" mb={16}>
                    {activeSocial.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activeSocial.map(t => (
                          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Check style={{ width: '14px', height: '14px', color: '#10C97D', flexShrink: 0 }} />
                            <span style={{ fontSize: '16px', fontWeight: 500, color: '#70737B' }}>{t.label}</span>
                            <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{t.value}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button className="pressable" onClick={() => goEdit('세금')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#FFF3F3', border: '1px dashed #FF3D3D', cursor: 'pointer', background: 'none' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#FF3D3D' }}>4대보험 항목 미설정</span>
                        <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600, backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>설정하기 →</span>
                      </button>
                    )}
                  </InfoRow>
                )}
              </>
            );
          })()}
        </div>

        {(() => {
          const s = staff;
          const totalWeeklyHours = s.workSchedule.reduce((sum, ws) => {
            const [start, end] = ws.time.split(" ~ ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
            return sum + Math.max(0, end - start);
          }, 0);

          const probRate = s.probation && s.probationRate ? parseFloat(s.probationRate) / 100 : 1;
          const holidayHours = (s.salaryType === "시급" && s.includeHolidayPay && totalWeeklyHours >= 15) ? (totalWeeklyHours / 40) * 8 : 0;

          let grossMonthly = 0;
          if (s.salaryType === "시급" && s.salaryAmount) {
            grossMonthly = Math.round((totalWeeklyHours + holidayHours) * Number(s.salaryAmount.replace(/,/g, "")) * 4 * probRate);
          } else if (s.salaryType === "월급 (연봉 포함)" && !s.isAnnualSalary && s.salaryAmount) {
            grossMonthly = Math.round(Number(s.salaryAmount.replace(/,/g, "")) * probRate);
          } else if (s.salaryType === "월급 (연봉 포함)" && s.isAnnualSalary && s.annualSalary) {
            grossMonthly = Math.round(Number(s.annualSalary.replace(/,/g, "")) / 12 * probRate);
          }

          if (grossMonthly === 0) return null;

          const activeIncome = s.incomeTax.filter(t => t.active);
          const activeSocial = s.socialInsurance.filter(t => t.active);
          const allTax = [...activeIncome, ...activeSocial];
          const healthTax = s.socialInsurance.find(t => t.key === "health");
          const healthAmount = (healthTax?.active && healthTax.value) ? Math.round(grossMonthly * parseFloat(healthTax.value) / 100) : 0;

          const taxLines = allTax
            .filter(t => t.key !== "industrial")
            .map(t => ({
              label: t.label,
              key: t.key,
              value: t.value,
              amount: t.key === "longterm"
                ? Math.round(healthAmount * parseFloat(t.value || "0") / 100)
                : Math.round(grossMonthly * parseFloat(t.value || "0") / 100),
            }));

          const taxTotal = taxLines.reduce((sum, t) => sum + t.amount, 0);
          const netMonthly = grossMonthly - taxTotal;

          return (
            <div style={{ margin: '0 20px 16px', padding: '16px', backgroundColor: '#F0F4FF', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: taxLines.length > 0 ? '10px' : '0' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#4261FF' }}>예상 급여 (세후)</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#4261FF' }}>{netMonthly.toLocaleString()}원</span>
              </div>
              {taxLines.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '10px', borderTop: '1px solid rgba(66,97,255,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#70737B' }}>세전 급여</span>
                    <span style={{ color: '#19191B', fontWeight: 500 }}>{grossMonthly.toLocaleString()}원</span>
                  </div>
                  {taxLines.map(t => (
                    <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#9EA3AD' }}>· {t.label} {t.key === "longterm" ? `(건강보험의 ${t.value}%)` : `${t.value}%`}</span>
                      <span style={{ color: '#9EA3AD' }}>-{t.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '6px', borderTop: '1px solid rgba(66,97,255,0.15)', marginTop: '2px' }}>
                    <span style={{ color: '#70737B' }}>공제 합계</span>
                    <span style={{ color: '#FF3D3D', fontWeight: 600 }}>-{taxTotal.toLocaleString()}원</span>
                  </div>
                </div>
              )}
              <p style={{ fontSize: '12px', color: '#9EA3AD', margin: '8px 0 0 0' }}>*산재보험은 사업주 부담으로 공제 제외</p>
              <p style={{ fontSize: '12px', color: '#9EA3AD', margin: '4px 0 0 0' }}>*계약 정보 기준 예상 금액으로 실지급액과 다를 수 있어요</p>
            </div>
          );
        })()}

        <Divider />

        {/* 인적 사항 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="인적 사항" onEdit={() => goEdit('인적사항')} isRegistered={!!staff.phone} readonly={isGhost} />
          <InfoRow label="생년월일">{staff.birthDate} ({staff.birthAge}세)</InfoRow>
          <InfoRow label="성별">{staff.gender === '남' ? '남자' : staff.gender === '여' ? '여자' : staff.gender}</InfoRow>
          <InfoRow label="전화번호">{staff.phone}</InfoRow>
          <InfoRow label="은행">{staff.bank}</InfoRow>
          <InfoRow label="계좌번호" mb={16}>
            <button onClick={() => handleCopy(staff.accountNumber)}
              className="pressable"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 500, color: '#4261FF', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {staff.accountNumber}
              <Copy style={{ width: '14px', height: '14px' }} />
            </button>
          </InfoRow>
        </div>

        <Divider />

        {/* 메모 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="메모" onEdit={() => goEdit('메모')} isRegistered={!!staff.memo} readonly={isGhost} />
          <InfoRow label="메모 내용" mb={16}>
            <span style={{ whiteSpace: 'pre-line' }}>{staff.memo || <span style={{ color: '#9EA3AD' }}>메모를 입력해주세요</span>}</span>
          </InfoRow>
        </div>

        <Divider />

        {/* 계약서 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="계약서" onEdit={() => goEdit('계약서')} isRegistered={!!(staff.resume || staff.laborContract || staff.healthCert)} readonly={isGhost} />
          <InfoRow label="이력서">
            {staff.resume
              ? <button className="pressable" onClick={() => setImagePreview(staff.resume)} style={{ color: '#4261FF', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em' }}>{staff.resume}</button>
              : <span style={{ color: '#9EA3AD' }}>미등록</span>}
          </InfoRow>
          <InfoRow label="근로계약서">
            {staff.laborContract
              ? <button className="pressable" onClick={() => setImagePreview(staff.laborContract)} style={{ color: '#4261FF', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em' }}>{staff.laborContract}</button>
              : <span style={{ color: '#9EA3AD' }}>미등록</span>}
          </InfoRow>
          <InfoRow label="보건증" mb={16}>
            {staff.healthCert
              ? <button className="pressable" onClick={() => setImagePreview(staff.healthCert)} style={{ color: '#4261FF', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em' }}>{staff.healthCert}</button>
              : <span style={{ color: '#9EA3AD' }}>미등록</span>}
          </InfoRow>
        </div>

        <Divider />

        {/* 근무 상태 */}
        <div style={{ padding: '16px 20px 0' }}>
          <SectionHeader title="근무 상태" onEdit={() => goEdit('근무상태')} isRegistered={!!staff.workStatus} readonly={isGhost} />
          {isGhost ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#70737B', width: '114px', flexShrink: 0 }}>근무 상태</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '24px', padding: '0 10px', borderRadius: '6px', backgroundColor: '#EAECEF', fontSize: '13px', fontWeight: 600, color: '#70737B' }}>앱 탈퇴</span>
              </div>
              <button onClick={() => goEdit('근무상태')}
                className="pressable"
                style={{ width: '100%', height: '52px', borderRadius: '14px', backgroundColor: '#19191B', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
                퇴사 처리하기 →
              </button>
            </div>
          ) : (
            <InfoRow label="근무 상태" mb={16}>{staff.workStatus}</InfoRow>
          )}
        </div>

      </div>

      {completionPopup && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={handleCompletionConfirm}>
          <div style={{ width: "calc(100% - 48px)", maxWidth: "320px", backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "32px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "8px" }}>직원 등록 완료!</h3>
            <p style={{ fontSize: "14px", color: "#70737B", textAlign: "center", lineHeight: "1.7", marginBottom: "24px", whiteSpace: "pre-line" }}>{"모든 정보가 등록되었어요.\n이제 급여 계산과 일정 관리를\n시작할 수 있어요."}</p>
            <button onClick={() => { handleCompletionConfirm(); navigate("/owner/staff"); }}
              className="pressable"
              style={{ width: "100%", height: "52px", borderRadius: "12px", backgroundColor: "#4261FF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: "pointer", marginBottom: "10px" }}>
              직원 관리하러 가기 →
            </button>
            <button onClick={handleCompletionConfirm}
              style={{ width: "100%", height: "44px", borderRadius: "12px", backgroundColor: "transparent", border: "none", fontSize: "14px", fontWeight: 500, color: "#9EA3AD", cursor: "pointer" }}>
              계속 정보 확인하기
            </button>
          </div>
        </div>,
        document.body
      )}

      {imagePreview && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setImagePreview("")}>
          <div style={{ width: "calc(100% - 48px)", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "20px", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em" }}>{imagePreview}</span>
              <button className="pressable" onClick={() => setImagePreview("")}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
            </div>
            <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F8" }}>
              {imagePreview.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                <div style={{ width: "100%", aspectRatio: "3/4", backgroundColor: "#E8E8E8", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", backgroundColor: "#DBDCDF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9EA3AD" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#70737B" }}>{imagePreview}</span>
                  <span style={{ fontSize: "12px", color: "#9EA3AD" }}>실제 환경에서는 이미지가 표시돼요</span>
                </div>
              ) : (
                <div style={{ width: "100%", aspectRatio: "3/4", backgroundColor: "#E8E8E8", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", backgroundColor: "#DBDCDF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9EA3AD" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#70737B" }}>{imagePreview}</span>
                  <span style={{ fontSize: "12px", color: "#9EA3AD" }}>실제 환경에서는 파일이 표시돼요</span>
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