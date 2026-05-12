import { Employee } from '@/types/employee';
import { StatusBadge } from './StatusBadge';
import { Pencil } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export const EmployeeCard = ({ employee, onClick }: EmployeeCardProps) => {
  const workDayNames = employee.workDays.map(w => w.day).join(', ');
  const hasNote = employee.note && employee.note.length > 0;
  const needsRegistration = employee.hourlyRate === 0 || !employee.note;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl p-4 card-shadow-md cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-3">
        {/* Profile Image */}
        <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0 overflow-hidden">
          {employee.profileImage ? (
            <img
              src={employee.profileImage}
              alt={employee.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-border flex items-center justify-center text-muted-foreground text-lg font-medium">
              {employee.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {employee.status.map((s, idx) => (
              <StatusBadge key={idx} status={s} />
            ))}
            <span className="font-semibold text-foreground">{employee.name}</span>
            <span className="text-sm text-muted-foreground">
              {employee.age}살 · {employee.gender} · {employee.employmentType}
            </span>
          </div>

          <div className="text-sm text-muted-foreground space-y-0.5">
            <div>
              <span className="text-foreground/70">입사일</span>{' '}
              <span className="font-medium text-foreground">{employee.hireDate}</span>{' '}
              <span className="text-muted-foreground">({employee.hireDays}일)</span>
            </div>
            <div className="flex gap-4">
              <span>
                <span className="text-foreground/70">근무일</span>{' '}
                <span className="font-medium text-foreground">{workDayNames}</span>
              </span>
              <span>
                <span className="text-foreground/70">급여일</span>{' '}
                <span className="font-medium text-foreground">{employee.payDay}일</span>
              </span>
            </div>
            <div>
              <span className="text-foreground/70">시급</span>{' '}
              <span className="font-medium text-foreground">
                {employee.hourlyRate.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Note/Warning Area */}
      <div className="mt-3 p-3 bg-secondary rounded-lg flex items-center justify-between">
        {needsRegistration && !hasNote ? (
          <div className="text-sm text-muted-foreground">
            <p>근무 일정이 등록되지 않았습니다</p>
            <p>근무 일정 및 직원 정보를 등록해주세요</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{employee.note}</p>
        )}
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
