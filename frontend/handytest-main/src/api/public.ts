const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// ========== auth ========== //

// 로그아웃
export async function logout() {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) throw new Error("로그아웃 실패");
    return response.json();
}

// 로그인 계정에 연결된 업장 조회
export async function getMyStores() {
    const res = await fetch(`${BASE_URL}/api/auth/my/stores`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error("업장 조회 실패");
    return res.json();
}

// 로그인 계정 정보 조회
export async function getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error("내 정보 조회 실패");
    return res.json();
}


// ========== common ========== //

// 인증번호 검증
export async function codeVerify(phone: string, code: string) {
    const response = await fetch(`${BASE_URL}/api/auth/signup/code/verify`, {
        method: "POST",
        body: JSON.stringify({ phone, code })
    });
    if (!response.ok) throw new Error("인증번호 검증 실패");
    return response.json();
}

// 인증번호 재전송
export async function codeResend(phone: string) {
    const response = await fetch(`${BASE_URL}/api/auth/signup/code/send`, {
        method: "POST",
        body: JSON.stringify({ phone })
    });
    if (!response.ok) throw new Error("인증번호 재전송 실패");
    return response.json();
}

// 자주 묻는 질문 조회 
export async function getFaq() {
    const response = await fetch(`${BASE_URL}/api/common/faq`);
    if (!response.ok) throw new Error("자주 묻는 질문 조회 실패");
    return response.json();
}

// 서비스 공지사항 조회
export async function getNotice() {
    const response = await fetch(`${BASE_URL}/api/common/notice`);
    if (!response.ok) throw new Error("서비스 공지사항 조회 실패");
    return response.json();
}

// 서비스 공지사항 세부 조회 
export async function getNoticeDetail(id: number) {
    const response = await fetch(`${BASE_URL}/api/common/notice/${id}`);
    if (!response.ok) throw new Error("서비스 공지사항 세부 조회 실패");
    return response.json();
}

// 고객 건의 추가
export async function postFeedback(
    member_id: number,
    title: string,
    content: string,
    images: string[]  // base64 data URL[]
) {
    const formData = new FormData();
    formData.append("member_id", String(member_id));
    formData.append("title", title);
    formData.append("content", content);

    // base64 → Blob 변환 후 append
    images.forEach((dataUrl, idx) => {
        const [meta, base64] = dataUrl.split(",");
        const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        formData.append("images", new Blob([arr], { type: mime }), `image_${idx}.jpg`);
    });

    const response = await fetch(`${BASE_URL}/api/common/feedback`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) throw new Error("건의 등록 실패");
    return response.json();
}

// 고객 건의 내역 조회 
export async function getFeedback() {
    const response = await fetch(`${BASE_URL}/api/common/feedback`, { credentials: 'include' });
    if (!response.ok) throw new Error("건의 내역 조회 실패");
    return response.json();
}

// 알림 내역 조회
export async function getNotification(unread_only = false, store_id: number) {
    const response = await fetch(`${BASE_URL}/api/common/notification?unread_only=${unread_only}&store_id=${store_id}`, { credentials: 'include' });
    if (!response.ok) throw new Error("알림 내역 조회 실패");
    return response.json();
}

// 알림 읽음 처리 
export async function markNotificationRead(id: string) {
    await fetch(`${BASE_URL}/api/common/notification/${id}/read`, { method: 'PATCH' });
}

// 회원탈퇴 사유 추가
export async function addWithdrawalReason(member_id: number, reason: string) {
    const response = await fetch(`${BASE_URL}/api/common/withdrawal`, {
        method: "POST",
        body: JSON.stringify({ member_id, reason })
    });
    if (!response.ok) throw new Error("회원 탈퇴 추가 실패");
    return response.json();
}

// 회원탈퇴 상태 변경
export async function UpdateWithdrawalMember(member_id: number) {
    const response = await fetch(`${BASE_URL}/api/auth/withdrawal/${member_id}`);
    if (!response.ok) throw new Error("회원 탈퇴 처리 실패");
    return response.json();
}