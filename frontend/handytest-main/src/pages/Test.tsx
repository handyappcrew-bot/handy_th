import { useNavigate } from 'react-router-dom';
import { Users, Calendar, FileText, User } from 'lucide-react';
// import { BottomNav } from '@/components/BottomNav';
import OpenCamera from '@/components/OpenCamera';
import GpsTest from '@/components/GpsTest';
import { useEffect } from 'react';
import { initPush } from '@/utils/push';
import Push from '@/components/Push';
import Map from '@/components/Map';


const Index = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Users,
      title: '직원 관리',
      description: '직원 정보를 관리하세요',
      path: '/employees',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Calendar,
      title: '로그인',
      description: '로그인 페이지로 이동해요',
      path: '/',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: FileText,
      title: '게시판',
      description: '공지사항을 확인하세요',
      path: '/board',
      color: 'bg-status-middle/10 text-status-middle',
    },
    {
      icon: User,
      title: '내 정보',
      description: '프로필을 관리하세요',
      path: '/profile',
      color: 'bg-muted text-muted-foreground',
    },
  ];

  useEffect(() => {
    initPush();
  }, []);

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (res.ok) {
      navigate("/");
    }
  }


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-4 py-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">안녕하세요 👋</h1>
        <p className="text-muted-foreground mt-1">오늘도 좋은 하루 되세요</p>
      </header>

      {/* Quick Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 card-shadow">
            <p className="text-sm text-muted-foreground">전체 직원</p>
            <p className="text-2xl font-bold text-foreground mt-1">12명</p>
          </div>
          <div className="bg-card rounded-xl p-4 card-shadow">
            <p className="text-sm text-muted-foreground">오늘 근무</p>
            <p className="text-2xl font-bold text-primary mt-1">4명</p>
          </div>
        </div>
      </section>

      <OpenCamera />
      <GpsTest />
      <Push />
      <Map />



      {/* Menu Grid */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-card rounded-xl p-4 card-shadow text-left hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Notifications */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">최근 알림</h2>
        <div className="bg-card rounded-xl p-4 card-shadow" onClick={handleLogout}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-badge-new-bg flex items-center justify-center">
              <Users className="w-5 h-5 text-status-new" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">로그아웃</p>
              <p className="text-xs text-muted-foreground">로그아웃합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* <BottomNav currentPath="/" /> */}
    </div>
  );
};

export default Index;
