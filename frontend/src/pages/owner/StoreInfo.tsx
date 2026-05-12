import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Building2, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { storeSettings } from "@/lib/storeSettings";
import { getStoreInfo } from "@/api/owner/store";

export interface StoreData {
  id: number;
  name: string;
  code: string;
  address: string;
  addressDetail: string | null;
  industry: string;
  owner: string;
  number: string;
  rawDigits: string;
  radius: number;
  setting: StoreSetting;
}

interface StoreSetting {
  id: number;
  store_id: number;
  open_time: string | null;
  close_time: string | null;
  is_holiday: boolean | null;
  holiday_cycle: string | null;
  holiday_day: number[];
  late_minutes: number | null;
  has_overtime_pay: boolean | null;
  overtime_minutes: number | null;
  overtime_after_8h: number | null;
  overtime_after_40h: number | null;
  overtime_multiplier: number | null;
  has_night_pay: boolean | null;
  night_minutes: number | null;
  night_multiplier: number | null;
  has_holiday_pay: boolean | null;
  holiday_minutes: number | null;
  holiday_after_8h: number | null;
  holiday_multiplier_under_8h: number | null;
  holiday_multiplier_over_8h: number | null;
}

export default function StoreInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  const storeId = location.state?.storeId || Number(localStorage.getItem("currentStoreId"));
  const [expanded, setExpanded] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [hours, setHours] = useState(storeSettings.getHours());
  const [parts, setParts] = useState(storeSettings.getParts());
  const [storeInfo, setStoreInfo] = useState<StoreData>();

  useEffect(() => {
    if (!storeId) return;

    // 매장 정보 조회
    const fetchStoreInfo = async () => {
      try {
        const storeInfo = await getStoreInfo(storeId);
        setStoreInfo(storeInfo);
      } catch {
        navigate(`/owner/home`);
      }
    }

    fetchStoreInfo()
  }, []);

  useEffect(() => {
    if (!storeInfo) return;

    const noHours = !storeInfo.setting.open_time || !storeInfo.setting.close_time || storeInfo.setting.is_holiday === null;
    const noStandard = storeInfo.radius === null || storeInfo.setting.late_minutes === null;

    // if (noHours) {
    //   navigate("/owner/store/hours", { state: { storeInfo } });
    // } else if (noStandard) {
    //   navigate("/owner/store/attendance-standard", { state: { storeInfo } });
    // }
  }, [storeInfo]);

  // 영업 파트 문자열 생성 (오후 미사용이면 제외)
  const partLines: string[] = [];
  if (parts.morningName && parts.morningStart && parts.morningEnd) {
    partLines.push(`${parts.morningName} ${parts.morningStart} ~ ${parts.morningEnd}`);
  }
  if (parts.afternoonUse === "사용" && parts.afternoonName && parts.afternoonStart && parts.afternoonEnd) {
    partLines.push(`${parts.afternoonName} ${parts.afternoonStart} ~ ${parts.afternoonEnd}`);
  }
  if (parts.eveningName && parts.eveningStart && parts.eveningEnd) {
    partLines.push(`${parts.eveningName} ${parts.eveningStart} ~ ${parts.eveningEnd}`);
  }
  const partsValue = partLines.join("\n") || "-";

  const holidayValue = hours.hasHoliday === "없음"
    ? "없음"
    : hours.holidayDays.length > 0
      ? `${hours.holidayCycle} ${hours.holidayDays.join(", ")}`
      : "-";

  const cardStyle = { boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' };

  console.log(storeInfo);

  if (!storeInfo) {
    return (
      <div className="min-h-screen max-w-lg mx-auto flex items-center justify-center">
        <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
              animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes navDotBounce {
            0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
            40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#F7F7F8' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate('/owner/home')} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>매장 관리</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        <div className="p-4 space-y-3">
          {/* 안내 배너 */}
          {bannerVisible && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', border: '1px solid #EBEBEB' }}>
              {/* 헤더 */}
              <div style={{ background: 'linear-gradient(135deg, #4261FF 0%, #6B84FF 100%)', padding: '14px 16px 16px', position: 'relative' }}>
                <button onClick={() => setBannerVisible(false)} style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.7)' }} />
                </button>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>매장 관리</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>매장의 모든 운영 정보를 한 곳에서 설정해요</p>
              </div>
              {/* 바로가기 목록 */}
              <div>
                {[
                  { label: '매장 정보', desc: '매장명 · 주소 · 대표자', path: '/owner/store/edit' },
                  { label: '운영 시간', desc: '영업시간 · 휴무일 · 파트', path: '/owner/store/hours' },
                  { label: '근태 기준', desc: '출퇴근 거리 · 지각 · 수당', path: '/owner/store/attendance-standard' },
                ].map(({ label, desc, path }, i, arr) => (
                  <button key={label} onClick={() => {
                    navigate(path, { state: { storeInfo } });

                  }}
                    className="pressable w-full flex items-center justify-between"
                    style={{ padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F1F2F4' : 'none', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#19191B' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{desc}</span>
                    </div>
                    <ChevronRight style={{ width: '16px', height: '16px', color: '#DBDCDF', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 매장 정보 */}
          <div className="bg-card rounded-2xl p-5" style={cardStyle}>
            <button onClick={() => navigate("/owner/store/edit", { state: { storeInfo } })}
              className="flex items-center justify-between w-full mb-3" >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" style={{ color: '#4261FF' }} />
                <h2 className="text-[18px] font-bold text-foreground">매장 정보</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="border-t border-border pt-3 space-y-2.5">
              <InfoRow label="매장명" value={storeInfo.name} />
              <InfoRow label="매장코드" value={storeInfo.code} isLink />
              {expanded && (
                <>
                  <InfoRow label="주소" value={`${storeInfo.address} ${storeInfo.addressDetail || ''}`} />
                  <InfoRow label="업종" value={storeInfo.industry} />
                  <InfoRow label="대표자명" value={storeInfo.owner} />
                  <InfoRow label="대표번호" value={storeInfo.number} />
                  <InfoRow label="사업자번호" value={storeInfo.rawDigits} />
                </>
              )}
            </div>
            <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-center gap-1 w-full mt-3 text-[13px] text-muted-foreground">
              {expanded ? "접기" : "더보기"}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* 운영 시간 설정 */}
          <div className="bg-card rounded-2xl p-5" style={cardStyle}>
            <button onClick={() => navigate("/owner/store/hours", { state: { storeInfo } })} className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: '#4261FF' }} />
                <h2 className="text-[18px] font-bold text-foreground">운영 시간 설정</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="border-t border-border pt-3 space-y-2.5">
              <InfoRow label="영업 시간" value={
                storeInfo.setting.open_time && storeInfo.setting.close_time
                  ? `${storeInfo.setting.open_time.slice(0, 5)} ~ ${storeInfo.setting.close_time.slice(0, 5)}`
                  : "-"
              } />
              <InfoRow label="고정 휴무일" value={holidayValue} />
              <InfoRow label="영업 파트" value={partsValue} />
            </div>
          </div>

          {/* 근태 기준 설정 */}
          <div className="bg-card rounded-2xl p-5" style={cardStyle}>
            <button onClick={() => navigate("/owner/store/attendance-standard", { state: { storeInfo } })} className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: '#4261FF' }} />
                <h2 className="text-[18px] font-bold text-foreground">근태 기준 설정</h2>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="border-t border-border pt-3 space-y-2.5">
              <InfoRow label="출퇴근 거리" value={`${storeInfo.radius}M`} />
              <InfoRow label="지각 기준" value="출근시간+5분 부터" />
              <InfoRow label="추가 수당" value={`연장 수당 : 미적용\n야간 수당 : 미적용\n휴일 수당 : 미적용`} />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  const handleClick = () => {
    if (isLink) {
      navigator.clipboard.writeText(value);
      toast({ description: "매장코드가 복사되었어요", duration: 2000 });
    }
  };
  return (
    <div className="flex gap-4" onClick={handleClick}>
      <span className="text-[14px] text-muted-foreground min-w-[80px] shrink-0">{label}</span>
      <span className={`text-[14px] whitespace-pre-line ${isLink ? "text-primary underline cursor-pointer" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}