export type ShiftType = "오픈" | "미들" | "마감";
export type EmploymentType = "정규직" | "알바생";

export interface TaxItem {
  key: string;
  label: string;
  value: string;
  active: boolean;
}

export interface WorkScheduleEntry {
  day: string;
  time: string;
  shifts: ShiftType[];
}

export interface StaffData {
  id: string;
  name: string;
  avatarColor: string;
  employmentType: EmploymentType;
  gender: string;
  age: number;
  birthDate: string;
  birthAge: number;
  hireDate: string;
  hireDaysAgo: number;
  salaryType: string;
  salaryAmount: string;
  isAnnualSalary: boolean;
  annualSalary: string;
  payCycle: string;
  payDay: string;
  includeHolidayPay: boolean;
  includeBreakTime: boolean;
  breakMinutes: number;
  probation: boolean;
  probationRate: string;
  probationStart: string;
  probationEnd: string;
  workSchedule: WorkScheduleEntry[];
  incomeTax: TaxItem[];
  socialInsurance: TaxItem[];
  phone: string;
  bank: string;
  accountNumber: string;
  memo: string;
  resume: string;
  laborContract: string;
  healthCert: string;
  workStatus: string;
  isNew?: boolean;
}

const DEFAULT_TAX: StaffData["incomeTax"] = [
  { key: "income", label: "소득세", value: "3", active: true },
  { key: "local", label: "지방소득세", value: "0.3", active: true },
];
const DEFAULT_INSURANCE: StaffData["socialInsurance"] = [
  { key: "national", label: "국민연금", value: "4.75", active: false },
  { key: "health", label: "건강보험", value: "3.595", active: false },
  { key: "longterm", label: "장기요양보험", value: "4.75", active: false },
  { key: "employment", label: "고용보험", value: "1.8", active: false },
  { key: "industrial", label: "산재보험", value: "1.47", active: false },
];
const AVATAR_COLORS = ["#5C4033","#C0392B","#1ABC9C","#2C3E50","#8E44AD","#E67E22","#4261FF","#E74C3C","#27AE60","#F39C12"];

function apiToStaffData(s: any): StaffData {
  const birth = s.birth ? s.birth.replace(/-/g, ".") : "";
  const hired = s.joined_at ? s.joined_at.slice(0, 10).replace(/-/g, ".") : "";
  const hireDaysAgo = hired ? Math.floor((Date.now() - new Date(s.joined_at).getTime()) / 86400000) : 0;
  const c = s.contract ?? {};
  return {
    id: String(s.id),
    name: s.name ?? "",
    avatarColor: AVATAR_COLORS[s.id % AVATAR_COLORS.length],
    employmentType: c.employee_type === "정직원" ? "정규직" : "알바생",
    gender: s.gender === "female" ? "여" : "남",
    age: birth ? new Date().getFullYear() - parseInt(birth.slice(0, 4)) : 0,
    birthDate: birth,
    birthAge: birth ? new Date().getFullYear() - parseInt(birth.slice(0, 4)) : 0,
    hireDate: hired,
    hireDaysAgo,
    salaryType: c.hourly_rate ? "시급" : "월급 (연봉 포함)",
    salaryAmount: c.hourly_rate ? c.hourly_rate.toLocaleString() : "0",
    isAnnualSalary: false,
    annualSalary: "",
    payCycle: c.salary_cycle ?? "월 1회 (월급)",
    payDay: c.salary_day ?? "15일",
    includeHolidayPay: true,
    includeBreakTime: false,
    breakMinutes: 30,
    probation: c.is_probation ?? false,
    probationRate: "90%",
    probationStart: "",
    probationEnd: "",
    workSchedule: [],
    incomeTax: DEFAULT_TAX,
    socialInsurance: DEFAULT_INSURANCE,
    phone: s.phone ?? "",
    bank: s.bank ?? "",
    accountNumber: s.account_number ?? "",
    memo: c.memo ?? "",
    resume: c.resume ?? "",
    laborContract: c.employment_contract ?? "",
    healthCert: c.health_certificate ?? "",
    workStatus: c.working_status ?? "재직",
  };
}

let _store: StaffData[] = [];
let _loaded = false;
const _listeners: Set<() => void> = new Set();

export const staffStore = {
  getAll(): StaffData[] {
    const active = _store.filter(s => s.workStatus !== "퇴사");
    const newStaff = active.filter(s => s.isNew);
    const empty = active.filter(s => !s.hireDate && !s.isNew && s.workStatus !== "앱탈퇴");
    const filled = active.filter(s => s.hireDate && !s.isNew && s.workStatus !== "앱탈퇴");
    const ghost = active.filter(s => s.workStatus === "앱탈퇴");
    return [...newStaff, ...empty, ...filled, ...ghost];
  },
  getById(id: string): StaffData | undefined {
    return _store.find(s => s.id === id);
  },
  update(id: string, patch: Partial<StaffData>): void {
    _store = _store.map(s => s.id === id ? { ...s, ...patch } : s);
    _listeners.forEach(fn => fn());
  },
  add(data: StaffData): void {
    _store = [..._store, data];
    _listeners.forEach(fn => fn());
  },
  subscribe(fn: () => void): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
  async loadFromApi(storeId: number): Promise<void> {
    if (_loaded) return;
    try {
      const res = await fetch(`/api/owner/store/${storeId}/staffs`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      _store = data.map(apiToStaffData);
      _loaded = true;
      _listeners.forEach(fn => fn());
    } catch {
      // silently fail — store stays empty
    }
  },
  reset(): void {
    _loaded = false;
    _store = [];
    _listeners.forEach(fn => fn());
  },
};

export function deriveListFields(s: StaffData) {
  const workDays = s.workSchedule.map(w => w.day).join(", ");
  const shiftOrder: ShiftType[] = ["오픈", "미들", "마감"];
  const shifts = shiftOrder.filter(sh =>
    s.workSchedule.some(w => w.shifts.includes(sh))
  );
  let salary = "";
  if (s.isAnnualSalary && s.annualSalary) {
    salary = `연봉  ${Number(s.annualSalary.replace(/,/g, "")).toLocaleString()}원`;
  } else if (s.salaryType === "월급 (연봉 포함)") {
    salary = `월급  ${Number(s.salaryAmount.replace(/,/g, "")).toLocaleString()}원`;
  } else {
    salary = `${s.salaryType}  ${Number(s.salaryAmount.replace(/,/g, "")).toLocaleString()}원`;
  }
  return { workDays, shifts, salary };
}
