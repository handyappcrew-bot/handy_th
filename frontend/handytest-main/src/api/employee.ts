const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const BASE = `${BASE_URL}/api/employee`;

/**
 * 공통 응답 처리 함수
 */
async function handleResponse(res: Response, defaultErrorMessage: string) {
    if (!res.ok) {
        try {
            const err = await res.json();
            if (res.status === 409) {
                throw new Error("409:" + (err.detail || "충돌이 발생했습니다."));
            }
            throw new Error(err.detail || defaultErrorMessage);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith("409:")) throw e;
            throw new Error(defaultErrorMessage);
        }
    }
    return res.json();
}

// --- 마감 보고 관련 ---

export async function addClosingReport(reportData: any) {
    try {
        const res = await fetch(`${BASE}/closing-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData),
            credentials: 'include',
        });
        return await handleResponse(res, '마감 보고 등록에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function checkClosingStatus(storeId: number): Promise<{ is_completed: boolean }> {
    try {
        const res = await fetch(`${BASE}/closing-report/check?store_id=${storeId}`, {
            credentials: 'include',
        });
        return await handleResponse(res, '마감 상태 확인에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// --- 내 정보 및 근태 관련 ---

export async function getMyInfo(store_id: number) {
    try {
        const res = await fetch(`${BASE}/mypage?store_id=${store_id}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        return await handleResponse(res, '내 정보를 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function clockIn(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/clock-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '출근 처리에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function clockOut(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/clock-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '퇴근 처리에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function breakStart(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/break-start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '휴게 시작 처리에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function breakEnd(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/break-end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '휴게 종료 처리에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// --- 근무 기록 요청 관련 ---

export async function requestWorkLogChange(workLogData: any) {
    try {
        const res = await fetch(`${BASE}/worklog/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workLogData),
            credentials: 'include',
        });
        return await handleResponse(res, '근무 기록 수정 요청에 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function fetchWorkLogRequests(storeId: number) {
    try {
        const res = await fetch(`${BASE}/worklog/request?store_id=${storeId}`, {
            credentials: 'include',
        });
        return await handleResponse(res, '수정 내역을 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// --- 스케줄 및 공지 관련 ---

export async function getScheduleChange(id: number) {
    try {
        const res = await fetch(`${BASE}/schedule-change/${id}`, {
            credentials: 'include',
        });
        return await handleResponse(res, '변경된 스케줄 정보를 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function getScheduleWork(id: number) {
    try {
        const res = await fetch(`${BASE}/schedule-work/${id}`, {
            credentials: 'include',
        });
        return await handleResponse(res, '추가된 스케줄 정보를 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function getTodayWork(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/today`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        if (res.status === 404) return null;
        return await handleResponse(res, '오늘의 근무 일정을 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function getWorkStatus(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '현재 근무 상태를 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function getWeeklyWork(store_id: number) {
    try {
        const res = await fetch(`${BASE}/work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '주간 근무 일정을 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

export async function getStoreNotice(store_id: number) {
    try {
        const res = await fetch(`${BASE}/notice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id }),
            credentials: 'include',
        });
        return await handleResponse(res, '공지사항을 불러오는데 실패했습니다.');
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}