const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getPayslips(storeId: number, year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.append('year', String(year));
  if (month) params.append('month', String(month));
  const query = params.toString() ? `?${params}` : '';
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips${query}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 목록 조회 실패');
  return res.json();
}

export async function getPayslipMonths(storeId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips/months`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여 월 목록 조회 실패');
  return res.json();
}

export async function getPayslipDetail(storeId: number, payslipId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips/${payslipId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 상세 조회 실패');
  return res.json();
}

export async function updatePayslip(storeId: number, payslipId: number, data: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips/${payslipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 수정 실패');
  return res.json();
}

export async function publishPayslip(storeId: number, payslipId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips/${payslipId}/publish`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 발급 실패');
  return res.json();
}

export async function transferPayslip(storeId: number, payslipId: number) {
  const res = await fetch(`${BASE_URL}/api/owner/store/${storeId}/payslips/${payslipId}/transfer`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여 이체 처리 실패');
  return res.json();
}
