import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: '신규' | '오픈' | '미들' | '마감';
  size?: 'sm' | 'md';
}

const statusStyles = {
  '신규': 'bg-badge-new-bg text-status-new',
  '오픈': 'bg-badge-open-bg text-status-open',
  '미들': 'bg-badge-middle-bg text-status-middle',
  '마감': 'bg-badge-closed-bg text-status-closed',
};

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        statusStyles[status],
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {status}
    </span>
  );
};
