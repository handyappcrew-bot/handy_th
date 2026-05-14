const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getTodayAttendance(storeId: number, date?: string) {
  const query = date ? `?date=${date}` : '';
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/attendance/today${query}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('출근현황 조회 실패');
  return res.json();
}
