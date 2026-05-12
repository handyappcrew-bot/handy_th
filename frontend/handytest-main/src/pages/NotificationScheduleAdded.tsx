import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getScheduleWork } from "@/api/employee";
import { useNavToast } from "@/hooks/use-nav-toast";

type ScheduleWork = {
  work_date: string;
  work_start: string;
  work_end: string;
  part_name: string | null;
};

const formatScheduleDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${days[d.getDay()]})`;
};

const formatTime = (timeStr: string) => timeStr?.slice(0, 5) ?? "";

const NotificationScheduleAdded = () => {
  const navigate = useNavigate();
  const { navigateTo } = useNavToast();
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleWork | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getScheduleWork(Number(id));
        setSchedule(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [id]);

  if (!schedule) return null;

  // part_id로 파트명 매핑 필요시 추가
  const partLabel = "오픈"; // TODO: part_id → 파트명 매핑

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-card">
      <div className="flex items-center gap-2 px-2 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-1 flex-shrink-0">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>알림 상세</h1>
      </div>
      <div className="border-b border-border" />

      <div className="flex-1 px-5 pt-4">
        <h2 className="text-[24px] font-bold text-foreground leading-tight">새로운 일정이 추가되었어요</h2>
        <p className="text-[24px] font-bold text-foreground leading-tight mt-1">내용을 확인해 주세요</p>

        <p className="mt-8 text-[14px] font-medium text-[#4261FF]">*추가된 일정</p>
        <div className="mt-2 rounded-2xl bg-[#F5F6F8] px-5 py-4 flex items-center gap-3">
          <span className="rounded-md bg-[#FFF8E1] px-2.5 py-0.5 text-[14px] font-medium text-[#F9A825]">
            {schedule.part_name ?? "-"}
          </span>
          <span className="text-[15px] font-medium text-foreground">{formatScheduleDate(schedule.work_date)}</span>
          <span className="text-[14px] text-[#93989E]">{formatTime(schedule.work_start)} - {formatTime(schedule.work_end)}</span>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4">
        <button onClick={() => navigateTo("/schedule", "일정 확인으로 이동했어요", { showLoading: true, forceAll: true })} className="w-full rounded-2xl bg-primary py-4 text-[16px] font-bold text-primary-foreground">
          일정 확인하기
        </button>
      </div>
    </div>
  );
};

export default NotificationScheduleAdded;