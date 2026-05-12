export type EmployeeStatus = '신규' | '오픈' | '미들' | '마감';
export type EmploymentType = '정규직' | '계약직' | '아르바이트' | '미등록';
export type PayCycle = '월급' | '연봉' | '월 2회' | '주급';
export type Gender = '남자' | '여자';

export interface WorkDay {
  day: string;
  startTime: string;
  endTime: string;
  status: '오픈' | '미들' | '마감';
}

export interface Employee {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  profileImage?: string;
  status: EmployeeStatus[];
  employmentType: EmploymentType;
  hireDate: string;
  hireDays: number;
  workDays: WorkDay[];
  payDay: number;
  hourlyRate: number;
  payCycle: PayCycle;
  note?: string;
  
  // Personal info
  birthDate: string;
  phone: string;
  bank: string;
  accountNumber: string;
  
  // Documents
  resume?: string;
  contract?: string;
  healthCert?: string;
}

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: '문자영',
    age: 22,
    gender: '여자',
    status: ['신규'],
    employmentType: '미등록',
    hireDate: '25.11.12',
    hireDays: 1,
    workDays: [
      { day: '월', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '화', startTime: '08:00', endTime: '22:00', status: '미들' },
      { day: '수', startTime: '08:00', endTime: '16:00', status: '오픈' },
    ],
    payDay: 15,
    hourlyRate: 0,
    payCycle: '월급',
    note: '',
    birthDate: '2001.02.03',
    phone: '010-5050-5050',
    bank: '신한은행',
    accountNumber: '3333-33-333333',
  },
  {
    id: '2',
    name: '문자영',
    age: 22,
    gender: '여자',
    status: ['오픈', '미들'],
    employmentType: '정규직',
    hireDate: '25.11.12',
    hireDays: 158,
    workDays: [
      { day: '월', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '화', startTime: '08:00', endTime: '22:00', status: '마감' },
      { day: '수', startTime: '08:00', endTime: '16:00', status: '미들' },
    ],
    payDay: 15,
    hourlyRate: 11000,
    payCycle: '월급',
    note: '주말 어렵다고함. 평일만 가능',
    birthDate: '2001.02.03',
    phone: '010-5050-5050',
    bank: '신한은행',
    accountNumber: '3333-33-333333',
  },
  {
    id: '3',
    name: '문자영',
    age: 22,
    gender: '여자',
    status: ['오픈'],
    employmentType: '정규직',
    hireDate: '25.11.12',
    hireDays: 158,
    workDays: [
      { day: '월', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '화', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '수', startTime: '08:00', endTime: '16:00', status: '오픈' },
    ],
    payDay: 15,
    hourlyRate: 11000,
    payCycle: '월급',
    note: '주말 어렵다고함. 평일만 가능',
    birthDate: '2001.02.03',
    phone: '010-5050-5050',
    bank: '신한은행',
    accountNumber: '3333-33-333333',
  },
  {
    id: '4',
    name: '문자영',
    age: 22,
    gender: '여자',
    status: ['마감'],
    employmentType: '계약직',
    hireDate: '25.11.12',
    hireDays: 158,
    workDays: [
      { day: '월', startTime: '08:00', endTime: '16:00', status: '마감' },
      { day: '화', startTime: '08:00', endTime: '16:00', status: '마감' },
      { day: '수', startTime: '08:00', endTime: '16:00', status: '마감' },
    ],
    payDay: 15,
    hourlyRate: 11000,
    payCycle: '월급',
    note: '',
    birthDate: '2001.02.03',
    phone: '010-5050-5050',
    bank: '신한은행',
    accountNumber: '3333-33-333333',
  },
  {
    id: '5',
    name: '정수민',
    age: 24,
    gender: '여자',
    status: ['오픈', '미들'],
    employmentType: '정규직',
    hireDate: '25.02.12',
    hireDays: 261,
    workDays: [
      { day: '월', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '화', startTime: '08:00', endTime: '22:00', status: '마감' },
      { day: '수', startTime: '08:00', endTime: '16:00', status: '오픈' },
      { day: '월', startTime: '08:00', endTime: '16:00', status: '미들' },
    ],
    payDay: 15,
    hourlyRate: 11000,
    payCycle: '월급',
    note: '하나둘 셋넷 2시는 근무가 어렵고 음 추가 근무는 어려운 상황',
    birthDate: '2001.02.03',
    phone: '010-5050-5050',
    bank: '신한은행',
    accountNumber: '3333-33-333333',
    resume: '정수민 이력서.png',
    contract: '정수민 근로계약서.png',
    healthCert: '정수민 보건증.png',
  },
];
