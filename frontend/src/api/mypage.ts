const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// 내 정보 수정
export async function changeInfo(
    name: string,
    bank: string,
    accountNumber: string,
    profileImage: string | null,
    originalImageUrl: string | null,
    documents: { resume: File | null; employment_contract: File | null; health_certificate: File | null }
) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bank", bank);
    formData.append("account_number", accountNumber);

    if (profileImage && profileImage.startsWith("data:")) {
        const [meta, base64] = profileImage.split(",");
        const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        formData.append("image", new Blob([arr], { type: mime }), "profile.jpg");
    }

    if (originalImageUrl) formData.append("original_image_url", originalImageUrl);
    if (documents.resume) formData.append("resume", documents.resume);
    if (documents.employment_contract) formData.append("employment_contract", documents.employment_contract);
    if (documents.health_certificate) formData.append("health_certificate", documents.health_certificate);

    const response = await fetch(`${BASE_URL}/api/employee/mypage/edit`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) throw new Error("사용자 정보를 찾을 수 없습니다.");
        throw new Error(errorData.detail || "서버 오류가 발생했어요. 다시 시도해주세요.");
    }

    return response.json();
}


// 비밀번호 변경 함수
export async function changePassword(oldPassword: string, newPassword: string) {
    try {
        const response = await fetch(`${BASE_URL}/api/common/password/change`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword, }),
            credentials: 'include',
        });

        // 응답이 성공(200 OK)이 아닐 경우
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // 에러 바디 파싱
            const status = response.status;

            if (status === 401) {
                // 백엔드에서 던진 "기존 비밀번호가 일치하지 않습니다" 메시지 처리
                throw new Error(errorData.detail || "기존 비밀번호가 일치하지 않아요.");
            } else if (status === 404) {
                throw new Error("사용자 정보를 찾을 수 없습니다.");
            } else {
                throw new Error("서버 오류가 발생했어요. 다시 시도해주세요.");
            }
        }

        return await response.json();
    } catch (err: any) {
        // 네트워크 에러나 위에서 던진 Error 객체를 다시 던짐
        console.error("비밀번호 변경 API 에러:", err);
        throw err;
    }
}