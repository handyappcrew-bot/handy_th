import { Geolocation } from '@capacitor/geolocation';

export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> =>
  Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  }).then((pos) => ({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  })).catch(() => {
    // Capacitor 실패 시 브라우저 fallback
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("위치 권한이 거부되었습니다.")),
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  });