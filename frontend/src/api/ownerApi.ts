const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface OwnerInfo {
    id: number;
    name: string;
    nickname: string | null;
    birth: string | null;
    gender: string;
    phone: string;
    joined_at: string;
    store_name: string;
    image: string | null;
}

export interface OwnerStore {
    id: number;
    code: string;
    industry: string;
    address: string;
    address_detail: string | null;
    name: string;
    owner_name: string;
    phone: string;
    employee_count: number;
    created_at: string;
}

export async function getOwnerInfo(memberId: number, storeId: number): Promise<OwnerInfo> {
    const res = await fetch(`${BASE_URL}/api/owner/mypage/${memberId}/info?store_id=${storeId}`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error("내 정보 조회 실패");
    return res.json();
}

export async function getOwnerStores(memberId: number): Promise<OwnerStore[]> {
    const res = await fetch(`${BASE_URL}/api/owner/mypage/${memberId}/stores`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error("매장 정보 조회 실패");
    return res.json();
}

export async function updateOwnerNickname(storeId: number, storeMemberId: number, nickname: string) {
    const res = await fetch(`${BASE_URL}/api/owner/mypage/${storeId}/nickname`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: storeMemberId, nickname }),
        credentials: 'include',
    });
    if (!res.ok) throw new Error("닉네임 변경 실패");
    return res.json();
}

// 사장 프로필 이미지 업로드/변경
export async function updateOwnerProfileImage(
    storeId: number,
    storeMemberId: number,
    file: File,
): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("store_member_id", String(storeMemberId));
    formData.append("image", file);
    const res = await fetch(`${BASE_URL}/api/owner/mypage/${storeId}/profile-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "프로필 이미지 업로드 실패");
    }
    return res.json();
}

// 사장 프로필 이미지 삭제 (기본 프로필)
export async function deleteOwnerProfileImage(
    storeId: number,
    storeMemberId: number,
): Promise<{ image_url: null }> {
    const res = await fetch(`${BASE_URL}/api/owner/mypage/${storeId}/profile-image?store_member_id=${storeMemberId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error("프로필 이미지 삭제 실패");
    return res.json();
}
