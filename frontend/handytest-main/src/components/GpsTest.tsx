import { useState } from "react";
import { getCurrentLocation } from "@/utils/gps";

export default function GpsTest() {
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetGps = async () => {
        try {
            setError(null);
            const loc = await getCurrentLocation();
            setLat(loc.lat);
            setLng(loc.lng);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="p-4 space-y-3">
            <button
                onClick={handleGetGps}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                현재 위치 가져오기
            </button>

            {lat && lng && (
                <div className="bg-gray-100 p-3 rounded">
                    <div>위도: {lat}</div>
                    <div>경도: {lng}</div>
                </div>
            )}

            {error && (
                <div className="text-red-500">
                    에러: {error}
                </div>
            )}
        </div>
    );
}
