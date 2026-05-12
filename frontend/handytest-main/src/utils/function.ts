
// role 컬럼의 값에 따라 직원 / 사장님 리턴하는 포맷팅 함수
export const setRoleLabel = (roleLabel: string) => {
    if (roleLabel == "employee") return "직원"
    else if (roleLabel == "owner") return "사장님"
}

// 이미지 조회 함수
const API_BASE = import.meta.env.VITE_API_URL ?? '';
export const getPhotoUrl = (photo: string): string => {
    // console.log('API_BASE:', import.meta.env.VITE_API_URL);
    // console.log('photo url:', getPhotoUrl(photo));
    return photo.startsWith('/uploads') ? `${API_BASE}${photo}` : photo;
}

export type NotificationCategory = "전체" | "급여" | "일정" | "게시판" | "공지" | "직원관리" | "대타관리";

export interface NotificationItem {
    id: string;
    type: NotificationCategory;
    message: string;
    reference_id?: number;
    created_at: string;
}

export const getLink = (type: string, message: string, referenceId?: number) => {
    if (type === "게시판") return `/board/${referenceId}`;
    if (type === "급여") return `/employee/salary/pay-stub/${referenceId}`;
    if (type === "공지") return `/announcements/${referenceId}`;
    if (type === "일정") {
        if (message.includes("변경")) return `/notifications/schedule-changed/${referenceId}`;
        if (message.includes("추가")) return `/notifications/schedule-added/${referenceId}`;
    }

    if (type === "직원관리") return `/owner/staff?tab=가입요청`;
    return undefined;
};

export const moveToHome = (currentRole: string) => {
    if (currentRole === "owner") return "/owner/home"
    else return "/employee/home"
}