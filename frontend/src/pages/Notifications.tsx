import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotice, getNotification } from "@/api/public";
import { getLink, NotificationCategory, NotificationItem } from "@/utils/function";
import { useNavToast } from "@/hooks/use-nav-toast";


const getFilterWidth = (label: string) => label.length <= 2 ? '48px' : '60px';
const getTagWidth = (label: string) => label.length <= 2 ? '32px' : '44px';

const formatNotificationDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const day = days[d.getDay()];
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "오전" : "오후";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${month}.${date}(${day}) ${ampm} ${h}:${minutes}`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { navigateTo } = useNavToast();
  const storeId = localStorage.getItem("currentStoreId");

  const [currentRole] = useState(() => localStorage.getItem("currentRole") ?? "employee");
  const filters: NotificationCategory[] = currentRole === "owner"
    ? ["전체", "급여", "일정", "게시판", "공지", "직원관리", "대타관리"]
    : ["전체", "급여", "일정", "게시판", "공지"];

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>("전체");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotification(false, Number(storeId));
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, []);

  const filteredNotifications = activeFilter === "전체"
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const handleNotificationClick = (notification: NotificationItem) => {
    const link = getLink(notification.type, notification.message, notification.reference_id);
    if (link) navigateTo(link, undefined, { showLoading: true, forceAll: true });
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px]" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1 flex-shrink-0">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>알림</h1>
      </div>
      <div className="border-b border-border" />

      <div style={{ backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
        <div className="flex px-5 py-3 overflow-x-auto" style={{ gap: '8px' }}>
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)}
              style={{
                width: getFilterWidth(filter), height: '28px', flexShrink: 0,
                borderRadius: '9999px', border: `1px solid ${activeFilter === filter ? '#4261FF' : '#DBDCDF'}`,
                backgroundColor: activeFilter === filter ? '#E8F3FF' : '#FFFFFF',
                fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em',
                color: activeFilter === filter ? '#4261FF' : '#AAB4BF',
              }}>
              {filter}
            </button>
          ))}
        </div>

        <p className="px-5 pb-2" style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>
          *알림은 30일 후 자동으로 삭제돼요
        </p>

        {filteredNotifications.length === 0 ? (
          <div className="flex flex-1 items-center justify-center pt-48">
            <p className="text-base text-muted-foreground">등록된 알림이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col px-5 pb-8" style={{ gap: '12px' }}>
            {filteredNotifications.map((notification) => (
              <button key={notification.id} onClick={() => handleNotificationClick(notification)}
                style={{
                  width: '100%', minHeight: '74px', backgroundColor: '#FFFFFF',
                  borderRadius: '12px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)',
                  padding: '16px', textAlign: 'left', display: 'flex',
                  flexDirection: 'column', justifyContent: 'center', gap: '4px',
                  cursor: getLink(notification.type, notification.message, notification.reference_id) ? 'pointer' : 'default',
                }}>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <span style={{
                    width: getTagWidth(notification.type), height: '24px',
                    backgroundColor: '#E8F3FF', borderRadius: '4px',
                    fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {notification.type}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>
                    {formatNotificationDate(notification.created_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#292B2E',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                }}>
                  {notification.message}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
