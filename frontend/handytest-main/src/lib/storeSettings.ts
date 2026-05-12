// 매장 설정 공유 스토어 (모듈 스코프)

export interface StoreHoursData {
  openTime: string;
  closeTime: string;
  hasHoliday: string;
  holidayCycle: string;
  holidayDays: string[];
}

export interface StorePartsData {
  morningName: string;
  morningStart: string;
  morningEnd: string;
  afternoonUse: string;
  afternoonName: string;
  afternoonStart: string;
  afternoonEnd: string;
  eveningName: string;
  eveningStart: string;
  eveningEnd: string;
}

let _hours: StoreHoursData = {
  openTime: "09:00",
  closeTime: "22:00",
  hasHoliday: "있음",
  holidayCycle: "매주",
  holidayDays: ["월", "화"],
};

let _parts: StorePartsData = {
  morningName: "오픈",
  morningStart: "09:00",
  morningEnd: "13:00",
  afternoonUse: "사용",
  afternoonName: "미들",
  afternoonStart: "13:00",
  afternoonEnd: "17:00",
  eveningName: "마감",
  eveningStart: "17:00",
  eveningEnd: "22:00",
};

const _listeners: Set<() => void> = new Set();

export const storeSettings = {
  getHours: (): StoreHoursData => ({ ..._hours }),
  getParts: (): StorePartsData => ({ ..._parts }),
  saveHours: (data: StoreHoursData) => {
    _hours = { ...data };
    _listeners.forEach(fn => fn());
  },
  saveParts: (data: StorePartsData) => {
    _parts = { ...data };
    _listeners.forEach(fn => fn());
  },
  subscribe: (fn: () => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
