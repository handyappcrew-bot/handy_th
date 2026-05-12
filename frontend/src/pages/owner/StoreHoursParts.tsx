import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/hooks/use-toast";
import { storeSettings } from "@/lib/storeSettings";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const MORNING_NAMES = ["오픈", "오전", "1교대"];
const AFTERNOON_NAMES = ["미들", "오후", "2교대"];
const EVENING_NAMES = ["마감", "저녁", "3교대"];

function SelectDrawer({
  open,
  onOpenChange,
  title,
  options,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [selected, setSelected] = useState(value);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        <div style={{ padding: "0 20px 20px" }} className="space-y-1">
          {options.map((opt) => {
            const isSelected = opt === selected;
            return (
              <button
                key={opt}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] flex items-center justify-between ${
                  isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
                onClick={() => {
                  setSelected(opt);
                  onSelect(opt);
                  onOpenChange(false);
                }}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TimePickerDrawer({
  open,
  onOpenChange,
  title,
  value,
  onSelect,
  filterAfter,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  value: string;
  onSelect: (v: string) => void;
  filterAfter?: string; // 이 시간 이후만 노출
}) {
  const [selected, setSelected] = useState(value);

  const filteredOptions = filterAfter
    ? TIME_OPTIONS.filter(t => t > filterAfter)
    : TIME_OPTIONS;

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        <div style={{ padding: "0 20px 20px", maxHeight: "300px", overflowY: "auto" }} className="space-y-1">
          {filteredOptions.map((time) => {
            const isSelected = time === selected;
            return (
              <button
                key={time}
                className={`w-full text-left px-4 py-3 rounded-xl text-[15px] flex items-center justify-between ${
                  isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
                onClick={() => {
                  setSelected(time);
                  onSelect(time);
                  onOpenChange(false);
                }}
              >
                <span>{time}</span>
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function StoreHoursParts() {
  const navigate = useNavigate();
    const location = useLocation();
  
    const storeInfo = location.state?.storeInfo;
    console.log(storeInfo);

  const _p = storeSettings.getParts();
  const [morningName, setMorningName] = useState(_p.morningName || "");
  const [morningStart, setMorningStart] = useState(_p.morningStart || "");
  const [morningEnd, setMorningEnd] = useState(_p.morningEnd || "");

  const [afternoonUse, setAfternoonUse] = useState(_p.afternoonUse || "");
  const [afternoonName, setAfternoonName] = useState(_p.afternoonName || "");
  const [afternoonStart, setAfternoonStart] = useState(_p.afternoonStart || "");
  const [afternoonEnd, setAfternoonEnd] = useState(_p.afternoonEnd || "");

  const [eveningName, setEveningName] = useState(_p.eveningName || "");
  const [eveningStart, setEveningStart] = useState(_p.eveningStart || "");
  const [eveningEnd, setEveningEnd] = useState(_p.eveningEnd || "");

  const [drawerType, setDrawerType] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAfternoonUsed = afternoonUse === "사용";

  const isComplete =
    morningName && morningStart && morningEnd &&
    afternoonUse &&
    eveningName && eveningStart && eveningEnd &&
    (!isAfternoonUsed || (afternoonName && afternoonStart && afternoonEnd));

  const handleSave = () => {
    storeSettings.saveParts({ morningName, morningStart, morningEnd, afternoonUse, afternoonName, afternoonStart, afternoonEnd, eveningName, eveningStart, eveningEnd });
    setConfirmOpen(false);
    toast({ description: "영업 시간이 저장되었어요", duration: 2000 });
    navigate("/owner/store");
  };

  // 각 파트 시작 시간 필터 계산
  // 오후 시작: 오전 종료 이후
  // 오후 종료: 오후 시작 이후
  // 저녁 시작: 오후 종료 이후 (오후 미사용이면 오전 종료 이후)
  // 저녁 종료: 저녁 시작 이후
  const afternoonStartFilter = morningEnd || undefined;
  const afternoonEndFilter = afternoonStart || morningEnd || undefined;
  const eveningStartFilter = isAfternoonUsed
    ? (afternoonEnd || afternoonStart || morningEnd || undefined)
    : (morningEnd || undefined);
  const eveningEndFilter = eveningStart || eveningStartFilter;

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>운영 시간 설정</h1>
          </div>
          {/* 진행 표시바 */}
          <div style={{ display: 'flex', gap: '6px', padding: '0 20px 8px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: '#4261FF' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: '#4261FF' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#AAB4BF' }}>① 완료</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF' }}>② 영업 파트</span>
          </div>
          <div className="border-b border-border" />
        </div>

        <div className="p-5">
          {/* 오전 파트 시간 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 className="text-[18px] font-bold text-foreground" style={{ marginBottom: '16px' }}>오전 파트 시간</h2>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                오전 파트명 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <p className="text-[13px]" style={{ color: '#AAB4BF', marginBottom: '8px' }}>*매장에서 사용하는 파트 용어를 선택해주세요 (예: 오픈, 오전, 1교대)</p>
              <button
                onClick={() => setDrawerType("morningName")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={morningName ? "text-foreground" : "text-muted-foreground"}>
                  {morningName || "오전 파트명 선택"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                오전 파트 시작 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("morningStart")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={morningStart ? "text-foreground" : "text-muted-foreground"}>
                  {morningStart || "오전 파트 시작 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                오전 파트 마감 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("morningEnd")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={morningEnd ? "text-foreground" : "text-muted-foreground"}>
                  {morningEnd || "오전 파트 종료 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* 오후 파트 시간 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 className="text-[18px] font-bold text-foreground" style={{ marginBottom: '16px' }}>오후 파트 시간</h2>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                오후 파트 여부 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("afternoonUse")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={afternoonUse ? "text-foreground" : "text-muted-foreground"}>
                  {afternoonUse || "오후 파트 여부 선택"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
              <p className="text-[14px]" style={{ color: '#AAB4BF', marginTop: '8px' }}>
                *오전·저녁 파트만 운영하는 경우 미사용으로 선택해주세요
              </p>
            </div>

            {isAfternoonUsed && (
              <>
                <div style={{ marginBottom: '30px' }}>
                  <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                    오후 파트명 <span style={{ color: '#FF3D3D' }}>*</span>
                  </label>
                  <p className="text-[13px]" style={{ color: '#AAB4BF', marginBottom: '8px' }}>*매장에서 사용하는 파트 용어를 선택해주세요 (예: 미들, 오후, 2교대)</p>
                  <button
                    onClick={() => setDrawerType("afternoonName")}
                    className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
                  >
                    <span className={afternoonName ? "text-foreground" : "text-muted-foreground"}>
                      {afternoonName || "오후 파트명 선택"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                    오후 파트 시작 시간 <span style={{ color: '#FF3D3D' }}>*</span>
                  </label>
                  <button
                    onClick={() => setDrawerType("afternoonStart")}
                    className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
                  >
                    <span className={afternoonStart ? "text-foreground" : "text-muted-foreground"}>
                      {afternoonStart || "오후 파트 시작 시간 입력"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                    오후 파트 마감 시간 <span style={{ color: '#FF3D3D' }}>*</span>
                  </label>
                  <button
                    onClick={() => setDrawerType("afternoonEnd")}
                    className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
                  >
                    <span className={afternoonEnd ? "text-foreground" : "text-muted-foreground"}>
                      {afternoonEnd || "오후 파트 종료 시간 입력"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 저녁 파트 시간 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 className="text-[18px] font-bold text-foreground" style={{ marginBottom: '16px' }}>저녁 파트 시간</h2>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                저녁 파트명 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <p className="text-[13px]" style={{ color: '#AAB4BF', marginBottom: '8px' }}>*매장에서 사용하는 파트 용어를 선택해주세요 (예: 마감, 저녁, 3교대)</p>
              <button
                onClick={() => setDrawerType("eveningName")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={eveningName ? "text-foreground" : "text-muted-foreground"}>
                  {eveningName || "저녁 파트명 선택"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                저녁 파트 시작 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("eveningStart")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={eveningStart ? "text-foreground" : "text-muted-foreground"}>
                  {eveningStart || "저녁 파트 시작 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                저녁 파트 마감 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("eveningEnd")}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
              >
                <span className={eveningEnd ? "text-foreground" : "text-muted-foreground"}>
                  {eveningEnd || "저녁 파트 종료 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* 저장하기 button */}
        {createPortal(
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-40" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
            <div style={{ padding: "16px 20px" }}>
              <button onClick={() => isComplete && setConfirmOpen(true)} disabled={!isComplete}
                style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: isComplete ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: isComplete ? "pointer" : "default" }}>
                저장하기
              </button>
            </div>
          </div>,
          document.body
        )}

        {confirmOpen && createPortal(
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={() => setConfirmOpen(false)}>
            <div style={{ width: "calc(100% - 48px)", maxWidth: "340px", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "4px" }}>운영 시간 설정 저장</h3>
              <p style={{ fontSize: "13px", color: "#70737B", textAlign: "center", marginBottom: "16px" }}>아래 내용으로 저장할게요. 확인해주세요.</p>

              {/* 요약 카드 */}
              <div style={{ backgroundColor: "#F7F8FF", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
                {/* 영업 시간 — StoreHours에서 저장된 값 */}
                {(() => {
                  const h = storeSettings.getHours();
                  return (
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #EBEBEB' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF', margin: '0 0 6px 0' }}>영업 시간</p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#19191B', margin: 0 }}>
                        {h.openTime} ~ {h.closeTime}
                        {h.openTime === "00:00" && h.closeTime === "00:00" && <span style={{ color: '#4261FF', fontSize: '12px', marginLeft: '6px' }}>24시간</span>}
                      </p>
                    </div>
                  );
                })()}

                {/* 오전 파트 */}
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF', margin: '0 0 4px 0' }}>오전 파트</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#19191B', margin: 0 }}>
                    {morningName} · {morningStart} ~ {morningEnd}
                  </p>
                </div>

                {/* 오후 파트 */}
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF', margin: '0 0 4px 0' }}>오후 파트</p>
                  {isAfternoonUsed ? (
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#19191B', margin: 0 }}>
                      {afternoonName} · {afternoonStart} ~ {afternoonEnd}
                    </p>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#9EA3AD', margin: 0 }}>미사용</p>
                  )}
                </div>

                {/* 저녁 파트 */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF', margin: '0 0 4px 0' }}>저녁 파트</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#19191B', margin: 0 }}>
                    {eveningName} · {eveningStart} ~ {eveningEnd}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setConfirmOpen(false)} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>취소</button>
                <button onClick={handleSave} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" }}>저장하기</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Drawers */}
        <SelectDrawer open={drawerType === "morningName"} onOpenChange={(o) => !o && setDrawerType(null)} title="오전 파트명 선택하기" options={MORNING_NAMES} value={morningName} onSelect={setMorningName} />
        <TimePickerDrawer open={drawerType === "morningStart"} onOpenChange={(o) => !o && setDrawerType(null)} title="오전 파트 시작 시간 선택" value={morningStart} onSelect={setMorningStart} />
        <TimePickerDrawer open={drawerType === "morningEnd"} onOpenChange={(o) => !o && setDrawerType(null)} title="오전 파트 마감 시간 선택" value={morningEnd} onSelect={(v) => { setMorningEnd(v); if (afternoonStart && afternoonStart <= v) setAfternoonStart(""); if (afternoonEnd && afternoonEnd <= v) setAfternoonEnd(""); if (eveningStart && eveningStart <= v) setEveningStart(""); if (eveningEnd && eveningEnd <= v) setEveningEnd(""); }} filterAfter={morningStart} />

        <SelectDrawer open={drawerType === "afternoonUse"} onOpenChange={(o) => !o && setDrawerType(null)} title="오후 파트 사용 여부 선택하기" options={["사용", "미사용"]} value={afternoonUse} onSelect={(v) => { setAfternoonUse(v); if (v === "미사용") { setAfternoonName(""); setAfternoonStart(""); setAfternoonEnd(""); } }} />
        <SelectDrawer open={drawerType === "afternoonName"} onOpenChange={(o) => !o && setDrawerType(null)} title="오후 파트명 선택하기" options={AFTERNOON_NAMES} value={afternoonName} onSelect={setAfternoonName} />
        <TimePickerDrawer open={drawerType === "afternoonStart"} onOpenChange={(o) => !o && setDrawerType(null)} title="오후 파트 시작 시간 선택" value={afternoonStart} onSelect={(v) => { setAfternoonStart(v); if (afternoonEnd && afternoonEnd <= v) setAfternoonEnd(""); if (eveningStart && eveningStart <= v) setEveningStart(""); if (eveningEnd && eveningEnd <= v) setEveningEnd(""); }} filterAfter={afternoonStartFilter} />
        <TimePickerDrawer open={drawerType === "afternoonEnd"} onOpenChange={(o) => !o && setDrawerType(null)} title="오후 파트 마감 시간 선택" value={afternoonEnd} onSelect={(v) => { setAfternoonEnd(v); if (eveningStart && eveningStart <= v) setEveningStart(""); if (eveningEnd && eveningEnd <= v) setEveningEnd(""); }} filterAfter={afternoonEndFilter} />

        <SelectDrawer open={drawerType === "eveningName"} onOpenChange={(o) => !o && setDrawerType(null)} title="저녁 파트명 선택하기" options={EVENING_NAMES} value={eveningName} onSelect={setEveningName} />
        <TimePickerDrawer open={drawerType === "eveningStart"} onOpenChange={(o) => !o && setDrawerType(null)} title="저녁 파트 시작 시간 선택" value={eveningStart} onSelect={(v) => { setEveningStart(v); if (eveningEnd && eveningEnd <= v) setEveningEnd(""); }} filterAfter={eveningStartFilter} />
        <TimePickerDrawer open={drawerType === "eveningEnd"} onOpenChange={(o) => !o && setDrawerType(null)} title="저녁 파트 마감 시간 선택" value={eveningEnd} onSelect={setEveningEnd} filterAfter={eveningEndFilter} />
      </div>
    </div>
  );
}
