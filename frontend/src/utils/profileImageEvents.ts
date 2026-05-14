// 프로필 사진 변경 알림 전역 이벤트
// ProfileEdit에서 업로드 성공 시 emit → Profile(보기) 화면이 즉시 받아 화면 갱신
// 직원/사장 양쪽에서 공용

const EVENT_NAME = "profile-image-changed";

export interface ProfileImageChangeDetail {
    // 새 서버 URL을 알 수 있는 경우 (사장 업로드 응답 등)
    imageUrl?: string | null;
    // 즉시 보여줄 로컬 미리보기(data URL) — 백엔드 응답이 image_url을 안 주는 경우(직원 mypage/edit)에 사용
    previewUrl?: string | null;
}

export function emitProfileImageChange(detail: ProfileImageChangeDetail) {
    window.dispatchEvent(new CustomEvent<ProfileImageChangeDetail>(EVENT_NAME, { detail }));
}

export function onProfileImageChange(callback: (detail: ProfileImageChangeDetail) => void) {
    const handler = (e: Event) => callback((e as CustomEvent<ProfileImageChangeDetail>).detail);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
}
