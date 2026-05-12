const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const BASE = `${BASE_URL}/api/employee`;

/**
 * 공통 응답 처리 함수
 */
async function handleResponse(res: Response, defaultErrorMessage: string) {
    if (!res.ok) {
        try {
            const err = await res.json();
            throw new Error(err.detail || defaultErrorMessage);
        } catch (e) {
            throw new Error(defaultErrorMessage);
        }
    }
    return res.json();
}

// --- 스케줄 조회 관련 ---

/**
 * 나의 일정 조회
 */
export async function getMySchedule(storeId: number, year: number, month: number) {
    try {
        const res = await fetch(`${BASE}/schedule/${storeId}?year=${year}&month=${month}`, {
            credentials: 'include'
        });
        return await handleResponse(res, "일정 조회에 실패했습니다.");
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

/**
 * 전체 직원 일정 조회
 */
export async function getAllSchedule(storeId: number, year: number, month: number) {
    try {
        const res = await fetch(`${BASE}/schedule/${storeId}/all?year=${year}&month=${month}`, {
            credentials: 'include'
        });
        return await handleResponse(res, "전체 일정 조회에 실패했습니다.");
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

/**
 * 요일별(특정일) 전체 직원 일정 조회
 */
export async function getAllScheduleDetail(storeId: number, year: number, month: number, day: number) {
    try {
        const res = await fetch(`${BASE}/schedule/${storeId}/detail?year=${year}&month=${month}&day=${day}`, {
            credentials: 'include'
        });
        return await handleResponse(res, "상세 일정 조회에 실패했습니다.");
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// --- 스케줄 변경 요청 관련 ---

/**
 * 변경 요청 조회
 */
export async function getScheduleChange(storeId: number) {
    try {
        const res = await fetch(`${BASE}/schedule/change?store_id=${storeId}`, {
            credentials: 'include'
        });
        return await handleResponse(res, "일정 변경 요청 조회에 실패했습니다.");
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

/**
 * 일정 변경 요청 등록
 */
export async function postScheduleChange(body: {
  store_id: number;
  type: "schedule_change" | "vacation";
  origin_date?: string;
  origin_start?: string;
  origin_end?: string;
  desired_date: string;
  desired_start?: string;
  desired_end?: string;
  reason?: string;
}) {
  try {
    const res = await fetch(`${BASE}/schedule/change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return await handleResponse(res, "일정 변경 요청에 실패했습니다.");
  } catch (err) {
    console.error("API 호출 에러:", err);
    throw err;
  }
}

/**
 * 변경 요청 내역 삭제
 */
export async function deleteScheduleChange(id: string) {
    try {
        const res = await fetch(`${BASE}/schedule/change/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return await handleResponse(res, "변경 요청 내역 삭제에 실패했습니다.");
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}