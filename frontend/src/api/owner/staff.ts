const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getStaffList(storeId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/staffs`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('직원 목록 조회 실패');
  return res.json();
}

export async function getStaffDetail(storeId: number, staffId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/staff/${staffId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('직원 정보 조회 실패');
  return res.json();
}

export async function updateStaffContract(storeId: number, staffId: number, data: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/staff/${staffId}/contract`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('직원 계약 수정 실패');
  return res.json();
}

export async function acceptMemberRequest(storeId: number, requestId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/member-requests/${requestId}/accept`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('가입 요청 수락 실패');
  return res.json();
}

export async function rejectMemberRequest(storeId: number, requestId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/member-requests/${requestId}/reject`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('가입 요청 거절 실패');
  return res.json();
}
