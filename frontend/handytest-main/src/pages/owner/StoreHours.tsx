import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useState } from "react";
import { storeSettings } from "@/lib/storeSettings";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function TimePickerDrawer({
  open,
  onOpenChange,
  title,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
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

        <div style={{ padding: "0 20px 20px", maxHeight: "300px", overflowY: "auto" }} className="space-y-1">
          {TIME_OPTIONS.map((time) => {
            const isSelected = time === selected;
            return (
              <button
                key={time}
                className={`w-full text-left px-4 py-3 rounded-xl text-[15px] flex items-center justify-between ${isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
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
                className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] flex items-center justify-between ${isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
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

function DayPickerDrawer({
  open,
  onOpenChange,
  selectedDays,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedDays: string[];
  onConfirm: (days: string[]) => void;
}) {
  const [localDays, setLocalDays] = useState<string[]>(selectedDays);

  const toggleDay = (day: string) => {
    setLocalDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const hasSelection = localDays.length > 0;

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>고정 휴무일 주기 선택하기</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <div className="flex gap-2 justify-center mb-6">
            {DAYS.map((day) => {
              const isSelected = localDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-lg text-[14px] font-medium border ${isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-3 rounded-xl text-[15px] font-medium text-primary bg-primary/10"
            >
              이전
            </button>
            <button
              onClick={() => {
                onConfirm(localDays);
                onOpenChange(false);
              }}
              disabled={!hasSelection}
              className={`flex-1 py-3 rounded-xl text-[15px] font-bold ${hasSelection
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function StoreHours() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const storeInfo = location.state?.storeInfo.setting;
  console.log(storeInfo);

  const _h = storeSettings.getHours();
  const [openTime, setOpenTime] = useState(storeInfo.open_time || "09:00");
  const [closeTime, setCloseTime] = useState(storeInfo.close_time || "22:00");
  const [hasHoliday, setHasHoliday] = useState(storeInfo.is_holiday || "없음");
  const [holidayCycle, setHolidayCycle] = useState(storeInfo.holiday_cycle || "");
  const [holidayDays, setHolidayDays] = useState<string[]>(storeInfo.holiday_day || []);

  const [drawerType, setDrawerType] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isComplete =
    openTime && closeTime && hasHoliday &&
    (hasHoliday === "없음" || (holidayCycle && holidayDays.length > 0));

  const handleNext = () => {
    storeSettings.saveHours({ openTime, closeTime, hasHoliday, holidayCycle, holidayDays });
    navigate("/owner/store/hours/parts", { state: { storeInfo } });
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>운영 시간 설정</h1>
          </div>
          {/* 진행 표시바 */}
          <div style={{ display: 'flex', gap: '6px', padding: '0 20px 8px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: '#4261FF' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: '#DBDCDF' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF' }}>① 영업 시간 · 휴무일</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#AAB4BF' }}>② 영업 파트</span>
          </div>
          <div className="border-b border-border" />
        </div>

        <div className="p-5">
          {/* 영업 시간 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 className="text-[18px] font-bold text-foreground" style={{ marginBottom: '16px' }}>영업 시간</h2>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                매장 오픈 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("openTime")}
                onMouseDown={() => setFocusedField("openTime")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
                onTouchStart={() => setFocusedField("openTime")} onTouchEnd={() => setFocusedField(null)}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: focusedField === "openTime" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}
              >
                <span className={openTime ? "text-foreground" : "text-muted-foreground"}>
                  {openTime || "오픈 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                매장 마감 시간 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("closeTime")}
                onMouseDown={() => setFocusedField("closeTime")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
                onTouchStart={() => setFocusedField("closeTime")} onTouchEnd={() => setFocusedField(null)}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: focusedField === "closeTime" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}
              >
                <span className={closeTime ? "text-foreground" : "text-muted-foreground"}>
                  {closeTime || "마감 시간 입력"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {openTime === "00:00" && closeTime === "00:00" ? (
              <p className="text-[14px]" style={{ color: '#4261FF', fontWeight: 600, marginTop: '-20px', marginBottom: '30px' }}>
                ✓ 24시간 영업으로 설정되었어요
              </p>
            ) : (
              <p className="text-[14px]" style={{ color: '#AAB4BF', marginTop: '-20px', marginBottom: '30px' }}>
                *오픈 시간과 마감 시간을 동일하게 00:00으로 입력하면 24시간 영업으로 적용돼요
              </p>
            )}
          </div>

          {/* 고정 휴무일 */}
          <div style={{ marginBottom: '30px' }}>
            <h2 className="text-[18px] font-bold text-foreground" style={{ marginBottom: '16px' }}>고정 휴무일</h2>

            <div style={{ marginBottom: '30px' }}>
              <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                고정 휴무일 여부 <span style={{ color: '#FF3D3D' }}>*</span>
              </label>
              <button
                onClick={() => setDrawerType("hasHoliday")}
                onMouseDown={() => setFocusedField("hasHoliday")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
                onTouchStart={() => setFocusedField("hasHoliday")} onTouchEnd={() => setFocusedField(null)}
                className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: focusedField === "hasHoliday" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}
              >
                <span className={hasHoliday ? "text-foreground" : "text-muted-foreground"}>
                  {hasHoliday || "고정 휴무일 여부 선택"}
                </span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {hasHoliday === "있음" && (
              <>
                <div style={{ marginBottom: '30px' }}>
                  <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                    고정 휴무일 주기 <span style={{ color: '#FF3D3D' }}>*</span>
                  </label>
                  <button
                    onClick={() => setDrawerType("holidayCycle")}
                    onMouseDown={() => setFocusedField("holidayCycle")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
                    onTouchStart={() => setFocusedField("holidayCycle")} onTouchEnd={() => setFocusedField(null)}
                    className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: focusedField === "holidayCycle" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}
                  >
                    <span className={holidayCycle ? "text-foreground" : "text-muted-foreground"}>
                      {holidayCycle || "주기 선택"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>
                    고정 휴무일 요일 <span style={{ color: '#FF3D3D' }}>*</span>
                  </label>
                  <button
                    onClick={() => setDrawerType("holidayDays")}
                    onMouseDown={() => setFocusedField("holidayDays")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
                    onTouchStart={() => setFocusedField("holidayDays")} onTouchEnd={() => setFocusedField(null)}
                    className="w-full flex items-center justify-between bg-background" style={{ height: '52px', padding: '0 20px', border: focusedField === "holidayDays" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}
                  >
                    <span className={holidayDays.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                      {holidayDays.length > 0 ? holidayDays.join(", ") : "휴무일 요일 선택"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {createPortal(
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-40" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
            <div style={{ padding: "16px 20px" }}>
              <button onClick={handleNext} disabled={!isComplete}
                style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: isComplete ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: isComplete ? "pointer" : "default" }}>
                다음
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Drawers */}
        <TimePickerDrawer
          open={drawerType === "openTime"}
          onOpenChange={(o) => !o && setDrawerType(null)}
          title="매장 오픈 시간 선택"
          value={openTime}
          onSelect={setOpenTime}
        />
        <TimePickerDrawer
          open={drawerType === "closeTime"}
          onOpenChange={(o) => !o && setDrawerType(null)}
          title="매장 마감 시간 선택"
          value={closeTime}
          onSelect={setCloseTime}
        />
        <SelectDrawer
          open={drawerType === "hasHoliday"}
          onOpenChange={(o) => !o && setDrawerType(null)}
          title="고정 휴무일 여부 선택하기"
          options={["있음", "없음"]}
          value={hasHoliday}
          onSelect={(v) => {
            setHasHoliday(v);
            if (v === "없음") {
              setHolidayCycle("");
              setHolidayDays([]);
            }
          }}
        />
        <SelectDrawer
          open={drawerType === "holidayCycle"}
          onOpenChange={(o) => !o && setDrawerType(null)}
          title="고정 휴무일 주기 선택하기"
          options={["매주", "격주"]}
          value={holidayCycle}
          onSelect={setHolidayCycle}
        />
        <DayPickerDrawer
          open={drawerType === "holidayDays"}
          onOpenChange={(o) => !o && setDrawerType(null)}
          selectedDays={holidayDays}
          onConfirm={setHolidayDays}
        />
      </div>
    </div>
  );
}
