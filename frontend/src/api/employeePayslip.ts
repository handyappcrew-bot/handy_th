const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getEmployeePayslips(storeId: number, year?: number, month?: number) {
  const params = new URLSearchParams();
  params.append('store_id', String(storeId));
  if (year) params.append('year', String(year));
  if (month) params.append('month', String(month));
  const res = await fetch(`${BASE_URL}/api/employee/payslips?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 목록 조회 실패');
  return res.json();
}

export async function getEmployeePayslipDetail(payslipId: number) {
  const res = await fetch(`${BASE_URL}/api/employee/payslips/${payslipId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('급여명세서 상세 조회 실패');
  return res.json();
}

export async function getSalaryPreview(storeId: number, year: number, month: number) {
  const res = await fetch(`${BASE_URL}/api/employee/salary/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store_id: storeId, year, month }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('예상급여 조회 실패');
  return res.json();
}
