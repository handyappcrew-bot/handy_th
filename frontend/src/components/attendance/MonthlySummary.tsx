interface MonthlySummaryProps {
  month: number;
  normalCount: number;
  lateCount: number;
  overtimeCount: number;
  absentCount: number;
}

const MonthlySummary = ({ month, normalCount, lateCount, overtimeCount, absentCount }: MonthlySummaryProps) => {
  const tagStyle = (bg: string, color: string) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '67px', height: '28px', borderRadius: '4px',
    fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em',
    backgroundColor: bg, color,
  });

  const countStyle = {
    fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B',
  };

  return (
    <div className="mx-5 mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="mb-3">
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          height: '28px', borderRadius: '4px', padding: '0 12px',
          fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em',
          backgroundColor: '#E8F3FF', color: '#4261FF',
        }}>
          {month}월 총 근무 내역
        </span>
      </div>
      <div className="border-t border-border pt-4">
        <div className="grid grid-cols-2 gap-y-3 gap-x-8">
          <div className="flex items-center gap-2">
            <span style={tagStyle('#ECFFF1', '#1EDC83')}>근무완료</span>
            <span style={countStyle}>{normalCount}회</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={tagStyle('#FFEEE2', '#FF862D')}>지각</span>
            <span style={countStyle}>{lateCount}회</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={tagStyle('#E8F3FF', '#7488FE')}>연장</span>
            <span style={countStyle}>{overtimeCount}회</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={tagStyle('#FFEAE6', '#FF3D3D')}>결근</span>
            <span style={countStyle}>{absentCount}회</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;