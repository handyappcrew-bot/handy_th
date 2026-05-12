import { ChevronRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ManagementCardProps {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function ManagementCard({ title, children, onClick }: ManagementCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'clamp(14px, 4vw, 16px)',
        padding: 'clamp(16px, 4.3vw, 18px) clamp(16px, 4.3vw, 20px)',
        boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)',
        border: 'none',
        cursor: 'pointer',
        display: 'block',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(10px, 2.9vw, 14px)' }}>
        <h3 style={{ fontSize: 'clamp(14px, 4.3vw, 16px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{title}</h3>
        <ChevronRight style={{ width: 'clamp(16px, 4.3vw, 18px)', height: 'clamp(16px, 4.3vw, 18px)', color: '#B0B3BB' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.7vw, 12px)' }}>{children}</div>
    </button>
  );
}

interface ManagementRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  alert?: string;
  onClick?: (e: React.MouseEvent) => void;
}

function ManagementRow({ icon, label, value, alert, onClick }: ManagementRowProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(e); } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.7vw, 12px)' }}>
        <div style={{
          width: 'clamp(36px, 10.7vw, 40px)',
          height: 'clamp(36px, 10.7vw, 40px)',
          borderRadius: '50%',
          backgroundColor: '#F2F3F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(16px, 4.8vw, 20px)',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 'clamp(12px, 3.5vw, 13px)', color: '#70737B', letterSpacing: '-0.02em', lineHeight: '1.4' }}>{label}</p>
          {value && <p style={{ fontSize: 'clamp(14px, 4.3vw, 16px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginTop: '2px' }}>{value}</p>}
        </div>
      </div>
      {alert && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: '#FFEAE6',
            borderRadius: '4px',
            padding: '4px 8px',
          }}>
            <AlertCircle style={{ width: '12px', height: '12px', color: '#FF3D3D' }} />
            <span style={{ fontSize: 'clamp(12px, 3.7vw, 14px)', fontWeight: 500, color: '#FF3D3D', letterSpacing: '-0.02em', whiteSpace: 'nowrap' as const }}>{alert}</span>
          </div>
          <ChevronRight style={{ width: '16px', height: '16px', color: '#B0B3BB' }} />
        </div>
      )}
    </div>
  );
}

export default function StoreManagementSection() {
  const navigate = useNavigate();

  const statusBadge = (color: string, bg: string, text: string) => (
    <span style={{
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: 'clamp(12px, 3.7vw, 14px)',
      fontWeight: 500,
      color,
      backgroundColor: bg,
      letterSpacing: '-0.02em',
      whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  );

  const divider = (
    <div style={{ height: '1px', backgroundColor: '#F2F3F5', margin: '2px 0' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.7vw, 12px)', padding: '0 clamp(14px, 4vw, 20px)' }}>

      {/* 근태 관리 */}
      <ManagementCard title="근태 관리" onClick={() => navigate("/owner/attendance")}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.7vw, 12px)' }}>
          <div style={{ width: 'clamp(36px, 10.7vw, 40px)', height: 'clamp(36px, 10.7vw, 40px)', borderRadius: '50%', backgroundColor: '#F2F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(16px, 4.8vw, 20px)', flexShrink: 0 }}>📋</div>
          <div>
            <p style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', color: '#9EA3AD', letterSpacing: '-0.02em', marginBottom: '6px' }}>11월 06일 근태 현황</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              {statusBadge('#10C97D', '#E5F9EC', '출근 6명')}
              {statusBadge('#FF862D', '#FFEEE2', '지각 1명')}
              {statusBadge('#4261FF', '#E8F3FF', '퇴근 2명')}
              {statusBadge('#FF3D3D', '#FFEAE6', '결근 0명')}
            </div>
          </div>
        </div>
      </ManagementCard>

      {/* 직원 관리 */}
      <ManagementCard title="직원 관리" onClick={() => navigate("/owner/staff")}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.7vw, 12px)' }}>
          <div style={{ width: 'clamp(36px, 10.7vw, 40px)', height: 'clamp(36px, 10.7vw, 40px)', borderRadius: '50%', backgroundColor: '#F2F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(16px, 4.8vw, 20px)', flexShrink: 0 }}>👥</div>
          <div>
            <p style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', color: '#9EA3AD', letterSpacing: '-0.02em', marginBottom: '6px' }}>총 직원 12명</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
              {statusBadge('#FFB300', '#FDF9DF', '오픈 3명')}
              {statusBadge('#1EDC83', '#ECFFF1', '미들 5명')}
              {statusBadge('#14C1FA', '#E8F9FF', '마감 4명')}
            </div>
          </div>
        </div>
        {divider}
        <ManagementRow
          icon="📝"
          label="가입 승인 요청"
          value="2명"
          alert="요청 확인 필요"
          onClick={() => navigate("/owner/staff?tab=가입요청")}
        />
      </ManagementCard>

      {/* 일정 관리 */}
      <ManagementCard title="일정 관리" onClick={() => navigate("/owner/schedule")}>
        <ManagementRow icon="🗓️" label="직원 일정 관리하기" />
        {divider}
        <ManagementRow
          icon="📅"
          label="일정 변경 요청"
          value="2건"
          alert="요청 확인 필요"
          onClick={() => navigate("/owner/schedule?tab=일정변경요청")}
        />
      </ManagementCard>

      {/* 매출 관리 */}
      <ManagementCard title="매출 관리" onClick={() => navigate("/owner/sales")}>
        <ManagementRow icon="📊" label="11월 총 매출" value="3,610,000원" />
      </ManagementCard>

      {/* 급여 관리 */}
      <ManagementCard title="급여 관리" onClick={() => navigate("/owner/salary")}>
        <ManagementRow icon="🪙" label="11월 예상 전체 직원 급여" value="2,220,000원" />
      </ManagementCard>

      {/* 게시판 관리 */}
      <ManagementCard title="게시판 관리" onClick={() => navigate("/board")}>
        <ManagementRow icon="📌" label="오늘 등록된 게시물" value="3건" />
      </ManagementCard>

      {/* 매장 관리 */}
      <ManagementCard title="매장 관리" onClick={() => navigate("/owner/store")}>
        <ManagementRow icon="🏪" label="매장 정보 관리하기" />
      </ManagementCard>

    </div>
  );
}
