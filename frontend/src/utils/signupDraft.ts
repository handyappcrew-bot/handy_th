// 회원가입 ProfileInfo 입력값 임시 저장 (약관 상세 왕복 시 보존용)

export const PROFILE_INFO_DRAFT_KEY = "signup:profileInfo:draft";

export interface ProfileInfoDraft {
  name: string;
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  gender: string;
  agreed: Record<string, boolean>;
}

export function loadProfileInfoDraft(): ProfileInfoDraft | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_INFO_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ProfileInfoDraft) : null;
  } catch {
    return null;
  }
}

export function saveProfileInfoDraft(draft: ProfileInfoDraft) {
  try {
    sessionStorage.setItem(PROFILE_INFO_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* 저장 실패 무시 */
  }
}

export function clearProfileInfoDraft() {
  try {
    sessionStorage.removeItem(PROFILE_INFO_DRAFT_KEY);
  } catch {
    /* noop */
  }
}
