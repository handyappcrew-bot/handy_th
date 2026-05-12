import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCurrentLocation } from "@/utils/gps";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

interface AttendanceMapDialogProps {
  open: boolean;
  type: "clock_in" | "clock_out";
  onConfirm: () => void;
  onCancel: () => void;
  storeLat: number;
  storeLng: number;
  storeRadius: number;
}

const loadKakaoScript = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.kakao?.maps) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AttendanceMapDialog = ({
  open, type, onConfirm, onCancel,
  storeLat, storeLng, storeRadius,
}: AttendanceMapDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const circleObj = useRef<any>(null);

  const [isInRange, setIsInRange] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 배경 스크롤 잠금만 (바텀네비는 유지)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      mapObj.current = null;
      circleObj.current = null;
      return;
    }

    setLoading(true);
    setGpsError(null);
    setIsInRange(false);

    const init = async () => {
      try {
        const { lat: userLat, lng: userLng } = await getCurrentLocation();
        const dist = getDistanceMeters(userLat, userLng, storeLat, storeLng);
        setDistance(Math.round(dist));
        setIsInRange(dist <= storeRadius);

        await loadKakaoScript();

        window.kakao.maps.load(() => {
          if (!mapRef.current) return;

          const storePos = new window.kakao.maps.LatLng(storeLat, storeLng);
          const userPos = new window.kakao.maps.LatLng(userLat, userLng);

          const map = new window.kakao.maps.Map(mapRef.current, {
            center: storePos,
            level: 4,
          });
          mapObj.current = map;

          new window.kakao.maps.Marker({ map, position: storePos });

          circleObj.current = new window.kakao.maps.Circle({
            map,
            center: storePos,
            radius: storeRadius,
            strokeWeight: 2,
            strokeColor: "#4261FF",
            strokeOpacity: 0.8,
            fillColor: "#4261FF",
            fillOpacity: 0.1,
          });

          const userMarkerContent = `
            <div style="
              width:16px; height:16px; border-radius:50%;
              background:#4261FF; border:3px solid #fff;
              box-shadow:0 0 0 3px rgba(66,97,255,0.3);
            "></div>
          `;
          new window.kakao.maps.CustomOverlay({
            map,
            position: userPos,
            content: userMarkerContent,
            zIndex: 10,
          });
        });
      } catch (e: any) {
        setGpsError(e.message ?? "GPS 오류");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [open, storeLat, storeLng, storeRadius]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 50 }}
      onClick={onCancel}
    >
      <div
        className="w-full animate-in zoom-in-95"
        style={{ maxWidth: '335px', width: 'calc(100% - 40px)', backgroundColor: '#FFFFFF', borderRadius: '20px', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', padding: '30px 20px 16px' }}>
          {type === "clock_in" ? "출근하기" : "퇴근하기"}
        </h2>

        {/* 지도 */}
        <div style={{ padding: '0 20px' }}>
          <div
            ref={mapRef}
            style={{ width: '100%', height: '288px', borderRadius: '16px', backgroundColor: '#f0f0f0', overflow: 'hidden', position: 'relative' }}
          >
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#70737B' }}>위치 확인 중...</span>
              </div>
            )}
          </div>
        </div>

        {/* 거리 안내 */}
        <div style={{ padding: '12px 20px 4px', textAlign: 'center' }}>
          {gpsError ? (
            <p style={{ fontSize: '13px', color: '#EF4444' }}>{gpsError}</p>
          ) : loading ? null : isInRange ? (
            <p style={{ fontSize: '13px', color: '#4261FF', fontWeight: 600 }}>
              매장 반경 내에 있어요 ({distance}m)
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: '#EF4444' }}>
              매장에서 {distance}m 떨어져 있어요 (반경 {storeRadius}m 이내 필요)
            </p>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, height: '48px', backgroundColor: '#DBDCDF', color: '#70737B', borderRadius: '10px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!isInRange}
            style={{ flex: 1, height: '48px', backgroundColor: isInRange ? '#4261FF' : '#E5E7EB', color: isInRange ? '#FFFFFF' : '#9CA3AF', borderRadius: '10px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: isInRange ? 'pointer' : 'not-allowed' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AttendanceMapDialog;