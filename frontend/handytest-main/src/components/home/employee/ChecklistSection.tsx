import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface CheckItem {
  id: number;
  content: string;
  is_achieved: boolean;
}

interface ChecklistSectionProps {
  userName: string;
  storeId: number;
}

const ChecklistSection = ({ userName, storeId }: ChecklistSectionProps) => {
  const [todoList, setTodoList] = useState<CheckItem[]>([]);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const completedCount = todoList.filter((i) => i.is_achieved).length;
  const totalCount = todoList.length;

  const toggleItem = async (id: number) => {

    try {
      const res = await fetch('/api/employee/todo/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "store_id": storeId, id })
      });

      const data = await res.json();

      if (res.ok) {
        setTodoList(data);
      } else {
        setError(true);
      }

    } catch (err) {
      setError(true);
      setErrorMsg("체크리스트를 조회하던 중 에러가 발생했습니다.");
    }

  };

  useEffect(() => {
    const employeeId = 1;
    const getTodoList = async () => {
      try {
        const res = await fetch('/api/employee/todo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "store_id": storeId, "employee_id": employeeId })
        });

        const data = await res.json();

        if (res.ok) {
          setTodoList(data);
        } else {
          setError(true);
        }

      } catch (err) {
        setError(true);
        setErrorMsg("체크리스트를 조회하던 중 에러가 발생했습니다.");
      }
    }

    getTodoList();
  }, []);

  return (
    <div className="px-5">
      <p style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>오늘 할 일</p>
      <p className="mb-4" style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>
        <span style={{ color: '#4261FF' }}>체크리스트</span>를 확인해주세요
      </p>

      <div className="rounded-2xl bg-card p-4" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
        <p className="mb-3 flex items-center" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: '#444444' }}>
          {userName} 님의 체크리스트
          <span style={{ marginLeft: '7px', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: '#70737B' }}>
            (<span style={{ color: '#10C97D' }}>{completedCount}</span>/{totalCount})
          </span>
        </p>
        <div className="mb-3 h-px w-full bg-[hsl(var(--checklist-divider))]" />

        <div className="flex flex-col gap-2.5">
          {todoList.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#AAB4BF', textAlign: 'center', padding: '16px 0' }}>
              오늘의 체크리스트가 없어요
            </p>
          ) : (
            todoList.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${item.is_achieved
                  ? "border-[hsl(var(--status-green))] bg-[hsl(var(--status-green-light))]"
                  : "border-transparent bg-muted"
                  }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.is_achieved
                    ? "bg-[hsl(var(--status-green))]"
                    : "border border-muted-foreground/30 bg-card"
                    }`}
                >
                  <Check className={`h-3.5 w-3.5 ${item.is_achieved ? "text-white" : "text-muted-foreground/30"}`} />
                </div>
                <span
                  className={`text-sm font-medium ${item.is_achieved ? "text-[hsl(var(--status-green))]" : "text-muted-foreground"
                    }`}
                >
                  {item.content}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistSection;