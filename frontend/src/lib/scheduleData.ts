// 공유 스케줄 데이터 - Index.tsx(홈 이번주) + Schedule.tsx(일정확인) 공통 사용

export type ShiftType = "open" | "middle" | "close";

export interface DaySchedule {
  start: string;
  end: string;
  type: ShiftType;
}

// 오늘 기준으로 날짜 키 생성 헬퍼
const dateKey = (date: Date): string => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

// 오늘 기준 N일 후/전 날짜
const relativeDate = (offset: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

// 이번주 월요일 기준 offset 계산
const getMondayOffset = (): number => {
  const dow = new Date().getDay(); // 0=일
  return dow === 0 ? -6 : 1 - dow;
};

// 이번주 월~일 날짜 객체
export const getThisWeekDates = (): Date[] => {
  const monOffset = getMondayOffset();
  return Array.from({ length: 7 }, (_, i) => relativeDate(monOffset + i));
};

// MY_SCHEDULE 동적 생성 - 이번주 + 전주/다음주 포함 넉넉히 4주치
export const MY_SCHEDULE: Record<string, DaySchedule> = (() => {
  const monOffset = getMondayOffset();
  const result: Record<string, DaySchedule> = {};

  // 패턴: 월오픈 화오픈 수미들 목미들 금무일정 토/일무일정 (주기 반복)
  const WEEK_PATTERN: (DaySchedule | null)[] = [
    { start: "08:00", end: "14:00", type: "open" },    // 월
    { start: "08:00", end: "14:00", type: "open" },    // 화
    { start: "14:00", end: "18:00", type: "middle" },  // 수
    { start: "14:00", end: "18:00", type: "middle" },  // 목
    null,                                               // 금 무일정
    null,                                               // 토
    null,                                               // 일
  ];

  // 이번주 기준 -2주 ~ +3주 총 5주치 생성
  for (let w = -2; w <= 3; w++) {
    for (let d = 0; d < 7; d++) {
      const date = relativeDate(monOffset + w * 7 + d);
      const pattern = WEEK_PATTERN[d];
      if (pattern) {
        result[dateKey(date)] = pattern;
      }
    }
  }

  return result;
})();

export const VACATION_DAYS: string[] = [];

export const HOLIDAY_DAYS: string[] = (() => {
  // 현재 월 기준 휴무일 (3, 10, 17일)
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return [3, 10, 17].map(d => `${y}-${m}-${d}`);
})();

// 홈화면 WeeklySchedule용 데이터
export const getWeeklyHomeData = () => {
  const weekDates = getThisWeekDates();
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const days = weekDates.map((date) => {
    const key = dateKey(date);
    const schedule = MY_SCHEDULE[key];
    const isHoliday = HOLIDAY_DAYS.includes(key);
    const isToday = date.getTime() === now.getTime();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return {
      day: DAY_NAMES[date.getDay()],
      date: date.getDate(),
      isToday,
      isWeekend,
      shiftType: isHoliday ? "휴무" : schedule
        ? (schedule.type === "open" ? "오픈" : schedule.type === "middle" ? "미들" : "마감")
        : undefined,
      startTime: isHoliday ? undefined : schedule?.start,
      endTime: isHoliday ? undefined : schedule?.end,
    };
  });

  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  return {
    dateRange: `${fmt(weekDates[0])}~${fmt(weekDates[6])}`,
    days,
  };
};
