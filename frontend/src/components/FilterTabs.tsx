import { cn } from '@/lib/utils';

interface FilterTabsProps {
  tabs: { label: string; count: number }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const FilterTabs = ({ tabs, activeTab, onTabChange }: FilterTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => onTabChange(tab.label)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            activeTab === tab.label
              ? 'bg-foreground text-background'
              : 'bg-card text-muted-foreground border border-border hover:border-foreground/30'
          )}
        >
          {tab.label} {tab.count}명
        </button>
      ))}
    </div>
  );
};
