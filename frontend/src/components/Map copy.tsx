import { getDistanceMeters } from "@/utils/distance";
import { getCurrentLocation } from "@/utils/gps";
import { useEffect, useRef } from "react";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

export default function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObj = useRef<any>(null);

    // 현재 위치 마커
    const myDot = useRef<any>(null);
    const myAccuracy = useRef<any>(null);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await loadKakaoScript();

        let lat = 0;
        let lng = 0;

        try {
            // 현재 위치 가져오기
            const pos = await getCurrentLocation();
            lat = pos.lat;
            lng = pos.lng;
        } catch (e) {
            console.log("위치 실패", e);
        }

        window.kakao.maps.load(() => {
            // 가게 위치 가져오기
            const STORE = { lat: 37.51285, lng: 126.94203 };
            const storePos = new window.kakao.maps.LatLng(STORE.lat, STORE.lng);
            const radius = 200;

            const map = new window.kakao.maps.Map(mapRef.current!, {
                center: storePos,
                level: 3
            });

            mapObj.current = map;

            // 가게 마커 생성
            new window.kakao.maps.Marker({
                map,
                position: storePos
            });

            // 가게 반경 설정
            new window.kakao.maps.Circle({
                center: storePos,
                radius: radius,
                strokeWeight: 2,
                strokeColor: '#75B8FA',
                fillColor: '#CFE7FF',
                fillOpacity: 0.5
            }).setMap(map);

            // 현재 위치 마커 생성
            myDot.current = new window.kakao.maps.Circle({
                center: storePos,
                radius: 4,
                strokeWeight: 0,
                fillColor: "#ff0000",
                fillOpacity: 1
            });
            myDot.current.setMap(map);

            myAccuracy.current = new window.kakao.maps.Circle({
                center: storePos,
                radius: 20,
                strokeWeight: 0,
                fillColor: "#ff0000",
                fillOpacity: 0.15
            });
            myAccuracy.current.setMap(map);


            // 실시간 GPS 시작
            startWatch(STORE);
        });
    };

    // -----------------------
    // 실시간 위치 추적 → dot 표시
    // -----------------------
    const startWatch = (STORE: { lat: number; lng: number }) => {
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;

                console.log("GPS:", lat, lng);

                const movePos = new window.kakao.maps.LatLng(lat, lng);

                myDot.current.setPosition(movePos);
                myAccuracy.current.setPosition(movePos);
                myAccuracy.current.setRadius(accuracy);

                mapObj.current.setCenter(movePos);

                const dist = getDistanceMeters(
                    lat,
                    lng,
                    STORE.lat,
                    STORE.lng
                );

                console.log("거리:", Math.round(dist), "m");
            },
            (err) => console.log("GPS error:", err),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 8000
            }
        );
    };

    // -----------------------
    // SDK 로드
    // -----------------------
    const loadKakaoScript = () =>
        new Promise<void>((resolve) => {
            if (window.kakao?.maps) {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src =
                `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });

    return (
        <div style={{ padding: 20 }}>
            <div ref={mapRef} style={{ width: 400, height: 400 }} />
        </div>
    );
}
