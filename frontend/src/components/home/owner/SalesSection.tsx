import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SalesData {
  label: string;
  dateRange: string;
  totalSales: number;
  salesAmount: number;
  laborCost: number;
}

interface SalesSectionProps {
  date: string;
  totalSales: number;
  salesAmount: number;
  laborCost: number;
}

const tabs = ["전날", "이번주", "이번달"] as const;

const salesByTab: Record<string, SalesData> = {
  "전날": {
    label: "11월 5일 총매출",
    dateRange: "",
    totalSales: 418000,
    salesAmount: 418000,
    laborCost: 185303,
  },
  "이번주": {
    label: "이번주 매출",
    dateRange: "(11.01 - 11.07)",
    totalSales: 418000,
    salesAmount: 418000,
    laborCost: 185303,
  },
  "이번달": {
    label: "11월 누적 매출",
    dateRange: "(11.01 - 11.07)",
    totalSales: 4018000,
    salesAmount: 418000,
    laborCost: 185303,
  },
};

export default function SalesSection({ date, totalSales, salesAmount, laborCost }: SalesSectionProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("전날");

  const formatCurrency = (n: number) =>
    n.toLocaleString("ko-KR") + "원";

  const data = salesByTab[activeTab];

  return (
    <section className="px-5">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: 'clamp(18px, 5.3vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>매출 현황</h2>
        <button onClick={() => navigate("/owner/sales")} className="flex items-center gap-0.5 text-[13px] text-muted-foreground">
          매출관리
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 칩 — 박스 바깥 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '5px 14px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: 700,
              color: activeTab === tab ? '#4261FF' : '#AAB4BF',
              backgroundColor: activeTab === tab ? '#E8F3FF' : '#FFFFFF',
              border: activeTab === tab ? '1px solid #4261FF' : '1px solid #DBDCDF',
              cursor: 'pointer',
              letterSpacing: '-0.02em',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 박스 */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'clamp(12px, 3.5vw, 14px)', padding: 'clamp(14px, 4.3vw, 16px)', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'clamp(13px, 3.7vw, 14px)', fontWeight: 500, color: '#19191B', letterSpacing: '-0.02em' }}>
            {data.label}{data.dateRange && <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', color: '#9EA3AD', marginLeft: '4px' }}>{data.dateRange}</span>}
          </span>
          <span style={{ fontSize: 'clamp(15px, 4.8vw, 18px)', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em' }}>
            {formatCurrency(data.totalSales)}
          </span>
        </div>
      </div>
    </section>
  );
}
