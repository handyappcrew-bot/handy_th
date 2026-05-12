const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface StoreInfo {
    id: number;
    name: string;
    address: string;
    addressDetail: string | null;
    industry: string;
    owner: string;
    number: string;
}

// 매장정보 조회
export async function getStoreInfo(storeId: number) {
    try {
        const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}`);
        if (!res.ok) throw new Error('매장 데이터를 불러오는데 실패했습니다.');
        const data = await res.json();
        return data;
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// 매장정보 수정
export async function updateStoreInfo(stroeData: StoreInfo) {
    try {
        const res = await fetch(`${BASE_URL}/api/owner/store/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stroeData),
            credentials: 'include',
        });
        if (!res.ok) throw new Error('매장 정보를 수정하는데 실패했습니다.');
        const data = await res.json();
        return data;
    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}
