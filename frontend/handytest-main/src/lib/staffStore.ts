// staffStore.ts
// StaffManagement / StaffDetail / StaffEdit 세 화면이 공유하는 단일 데이터 소스.
// React Context 없이 모듈 스코프 객체로 관리 (목업 수준).
// 실제 프로덕션에서는 서버 API + React Query로 교체.

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
  gender: string;          // "남" | "여" (목록용 축약) — 상세/수정에서는 "남자"/"여자"
  age: number;
  birthDate: string;       // "2001.02.03"
  birthAge: number;

  // 계약 정보
  hireDate: string;        // "2025.02.12"
  hireDaysAgo: number;
  salaryType: string;      // "시급" | "월급 (연봉 포함)"
  salaryAmount: string;    // 콤마 포함 숫자 문자열 "11,000"
  isAnnualSalary: boolean;
  annualSalary: string;
  payCycle: string;        // "월 1회 (월급)" | "주급" | "월 2회"
  payDay: string;
  includeHolidayPay: boolean;
  includeBreakTime: boolean;
  breakMinutes: number;
  probation: boolean;
  probationRate: string;   // "90%"
  probationStart: string;
  probationEnd: string;
  workSchedule: WorkScheduleEntry[];

  // 세금
  incomeTax: TaxItem[];
  socialInsurance: TaxItem[];

  // 인적 사항
  phone: string;
  bank: string;
  accountNumber: string;

  // 메모
  memo: string;

  // 계약서
  resume: string;
  laborContract: string;
  healthCert: string;

  // 근무 상태
  workStatus: string;
  isNew?: boolean;  // 가입 요청 수락 후 계약정보 미등록 상태
}

// ── 초기 데이터 ──────────────────────────────────────────
const initialData: StaffData[] = [
  {
    id: "1", name: "정수민", avatarColor: "#1ABC9C",
    employmentType: "정규직", gender: "여", age: 24,
    birthDate: "2001.02.03", birthAge: 24,
    hireDate: "2025.02.12", hireDaysAgo: 261,
    salaryType: "시급", salaryAmount: "11,000",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "15일", includeHolidayPay: true, includeBreakTime: false, breakMinutes: 30,
    probation: false, probationRate: "90%", probationStart: "", probationEnd: "",
    workSchedule: [
      { day: "월", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
      { day: "화", time: "08:00 ~ 22:00", shifts: ["오픈", "미들", "마감"] },
      { day: "수", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
      { day: "목", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: true },
      { key: "local", label: "지방소득세", value: "0.3", active: true },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: true },
      { key: "health", label: "건강보험", value: "3.595", active: true },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: true },
      { key: "employment", label: "고용보험", value: "1.8", active: true },
      { key: "industrial", label: "산재보험", value: "1.47", active: true },
    ],
    phone: "010-5050-5050", bank: "신한은행", accountNumber: "3333-33-333333",
    memo: "하나둘 셋넷 2시 근무가 어렵고 옴\n추가 근무는 어려운 상황",
    resume: "정수민_이력서.png", laborContract: "정수민_근로계약서.png", healthCert: "정수민_보건증.png",
    workStatus: "재직",
  },
  {
    id: "2", name: "문자영", avatarColor: "#C0392B",
    employmentType: "알바생", gender: "여", age: 22,
    birthDate: "2001.02.03", birthAge: 24,
    hireDate: "2025.02.12", hireDaysAgo: 261,
    salaryType: "시급", salaryAmount: "11,000",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "1, 15일", includeHolidayPay: true, includeBreakTime: false, breakMinutes: 30,
    probation: true, probationRate: "90%", probationStart: "2025.02.12", probationEnd: "2025.05.12",
    workSchedule: [
      { day: "월", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
      { day: "화", time: "08:00 ~ 22:00", shifts: ["오픈", "마감"] },
      { day: "수", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: true },
      { key: "local", label: "지방소득세", value: "0.3", active: true },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: false },
      { key: "health", label: "건강보험", value: "3.595", active: false },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: false },
      { key: "employment", label: "고용보험", value: "1.8", active: false },
      { key: "industrial", label: "산재보험", value: "1.47", active: false },
    ],
    phone: "010-5050-5050", bank: "신한은행", accountNumber: "3333-33-333333",
    memo: "하나둘 셋넷 2시 근무가 어렵고 옴\n추가 근무는 어려운 상황",
    resume: "문자영_이력서.png", laborContract: "문자영_근로계약서.png", healthCert: "문자영_보건증.png",
    workStatus: "재직",
  },
  {
    id: "3", name: "가나디", avatarColor: "#5C4033",
    employmentType: "알바생", gender: "남", age: 24,
    birthDate: "2001.02.03", birthAge: 24,
    hireDate: "2025.10.12", hireDaysAgo: 31,
    salaryType: "시급", salaryAmount: "12,000",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "15일", includeHolidayPay: true, includeBreakTime: false, breakMinutes: 30,
    probation: false, probationRate: "90%", probationStart: "", probationEnd: "",
    workSchedule: [
      { day: "화", time: "08:00 ~ 16:00", shifts: ["오픈"] },
      { day: "수", time: "08:00 ~ 16:00", shifts: ["오픈"] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: true },
      { key: "local", label: "지방소득세", value: "0.3", active: true },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: false },
      { key: "health", label: "건강보험", value: "3.595", active: false },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: false },
      { key: "employment", label: "고용보험", value: "1.8", active: false },
      { key: "industrial", label: "산재보험", value: "1.47", active: false },
    ],
    phone: "010-5050-5050", bank: "신한은행", accountNumber: "3333-33-333333",
    memo: "가나디 귀여워",
    resume: "가나디_이력서.png", laborContract: "가나디_근로계약서.png", healthCert: "가나디_보건증.png",
    workStatus: "재직",
  },
  {
    id: "4", name: "최지혁", avatarColor: "#FF9800",
    employmentType: "알바생", gender: "남", age: 24,
    birthDate: "2001.02.03", birthAge: 24,
    hireDate: "2025.09.12", hireDaysAgo: 61,
    salaryType: "시급", salaryAmount: "10,320",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "15일", includeHolidayPay: true, includeBreakTime: false, breakMinutes: 30,
    probation: false, probationRate: "90%", probationStart: "", probationEnd: "",
    workSchedule: [
      { day: "목", time: "08:00 ~ 16:00", shifts: ["미들"] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: true },
      { key: "local", label: "지방소득세", value: "0.3", active: true },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: false },
      { key: "health", label: "건강보험", value: "3.595", active: false },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: false },
      { key: "employment", label: "고용보험", value: "1.8", active: false },
      { key: "industrial", label: "산재보험", value: "1.47", active: false },
    ],
    phone: "010-5050-5050", bank: "신한은행", accountNumber: "3333-33-333333",
    memo: "가나디 귀여워",
    resume: "", laborContract: "", healthCert: "",
    workStatus: "재직",
  },
  {
    id: "5", name: "이클립스", avatarColor: "#8E44AD",
    employmentType: "정규직", gender: "남", age: 24,
    birthDate: "2001.02.03", birthAge: 24,
    hireDate: "2025.09.12", hireDaysAgo: 61,
    salaryType: "월급 (연봉 포함)", salaryAmount: "1,280,000",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "15일", includeHolidayPay: true, includeBreakTime: false, breakMinutes: 30,
    probation: false, probationRate: "90%", probationStart: "", probationEnd: "",
    workSchedule: [
      { day: "목", time: "08:00 ~ 16:00", shifts: ["미들", "마감"] },
      { day: "금", time: "08:00 ~ 16:00", shifts: ["미들", "마감"] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: true },
      { key: "local", label: "지방소득세", value: "0.3", active: true },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: true },
      { key: "health", label: "건강보험", value: "3.595", active: true },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: true },
      { key: "employment", label: "고용보험", value: "1.8", active: true },
      { key: "industrial", label: "산재보험", value: "1.47", active: true },
    ],
    phone: "010-5050-5050", bank: "신한은행", accountNumber: "3333-33-333333",
    memo: "가나디 귀여워",
    resume: "이클립스_이력서.png", laborContract: "이클립스_근로계약서.png", healthCert: "이클립스_보건증.png",
    workStatus: "재직",
  }
  ,{
    id: "ghost_1", name: "박서연", avatarColor: "#B0B8C1",
    employmentType: "알바생", gender: "여", age: 23,
    birthDate: "2002.05.14", birthAge: 23,
    hireDate: "2024.11.01", hireDaysAgo: 540,
    salaryType: "시급", salaryAmount: "10,030",
    isAnnualSalary: false, annualSalary: "",
    payCycle: "월 1회 (월급)", payDay: "15일", includeHolidayPay: false, includeBreakTime: false, breakMinutes: 0,
    probation: false, probationRate: "", probationStart: "", probationEnd: "",
    workSchedule: [
      { day: "화", time: "10:00 ~ 16:00", shifts: ["미들"] as ShiftType[] },
      { day: "목", time: "10:00 ~ 16:00", shifts: ["미들"] as ShiftType[] },
    ],
    incomeTax: [
      { key: "income", label: "소득세", value: "3", active: false },
      { key: "local", label: "지방소득세", value: "0.3", active: false },
    ],
    socialInsurance: [
      { key: "national", label: "국민연금", value: "4.75", active: false },
      { key: "health", label: "건강보험", value: "3.595", active: false },
      { key: "longterm", label: "장기요양보험", value: "4.75", active: false },
      { key: "employment", label: "고용보험", value: "1.8", active: false },
      { key: "industrial", label: "산재보험", value: "1.47", active: false },
    ],
    phone: "010-2233-4455", bank: "카카오뱅크", accountNumber: "3333-12-3456789",
    memo: "",
    resume: "", laborContract: "박서연_근로계약서.png", healthCert: "",
    workStatus: "앱탈퇴",
  }
];

// ── 모듈 스코프 스토어 ────────────────────────────────────
let _store: StaffData[] = initialData.map(d => ({ ...d }));
const _listeners: Set<() => void> = new Set();

export const staffStore = {
  getAll(): StaffData[] {
    // 퇴사 직원 제외, 신규 > 미등록 > 일반 > 앱탈퇴 순
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
};

// ── 헬퍼: StaffData → StaffManagement 카드용 파생값 ────────
export function deriveListFields(s: StaffData) {
  // 근무일 문자열
  const workDays = s.workSchedule.map(w => w.day).join(", ");

  // 시프트 목록 (중복 제거, 순서 유지)
  const shiftOrder: ShiftType[] = ["오픈", "미들", "마감"];
  const shifts = shiftOrder.filter(sh =>
    s.workSchedule.some(w => w.shifts.includes(sh))
  );

  // 급여 표시 문자열
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