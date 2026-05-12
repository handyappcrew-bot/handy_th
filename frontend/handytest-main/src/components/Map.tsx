import { useEffect, useRef } from "react";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

interface MapProps {
    lat: number;
    lng: number;
}

export default function Map({ lat, lng }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObj = useRef<any>(null);

    useEffect(() => {
        // lat, lng 값이 유효할 때만 실행
        if (lat && lng) {
            init();
        }
    }, [lat, lng]); // 👈 좌표가 바뀌면 지도를 새로 그리도록 설정

    const init = async () => {
        await loadKakaoScript();

        window.kakao.maps.load(() => {
            if (!mapRef.current) return;

            const storePos = new window.kakao.maps.LatLng(lat, lng);

            // 지도가 이미 생성되어 있다면 중심만 이동, 없으면 새로 생성
            if (!mapObj.current) {
                const map = new window.kakao.maps.Map(mapRef.current, {
                    center: storePos,
                    level: 3
                });
                mapObj.current = map;

                new window.kakao.maps.Marker({
                    map: map,
                    position: storePos
                });
            } else {
                mapObj.current.setCenter(storePos);
            }
        });
    };

    const loadKakaoScript = () =>
        new Promise<void>((resolve) => {
            if (window.kakao?.maps) {
                resolve();
                return;
            }
            const script = document.createElement("script");
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });

    return (
        <div
            ref={mapRef}
            className="w-full h-full" // Tailwind를 쓰신다면 이게 확실합니다.
            style={{ minHeight: "300px", backgroundColor: "#f0f0f0" }} // 배경색을 넣어 영역이 잡히는지 확인
        />
    );
}