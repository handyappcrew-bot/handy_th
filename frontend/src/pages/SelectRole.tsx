import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyStores } from "@/api/public";

interface StoreAccount {
  storeId: number;
  storeName: string;
  role: "owner" | "employee";
  storeMemberId: number;
}

export default function SelectRole() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<StoreAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stores = await getMyStores();
        const mapped: StoreAccount[] = stores.map((s: any) => ({
          storeId: s.store_id,
          storeName: s.store_name,
          role: s.role,
          storeMemberId: s.store_member_id,
        }));
        setAccounts(mapped);
      } catch {
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (account: StoreAccount) => {
    localStorage.setItem("currentRole", account.role);
    localStorage.setItem("currentStoreId", String(account.storeId));
    localStorage.setItem("currentEmployeeId", String(account.storeMemberId));
    if (account.role === "owner") {
      navigate("/owner/home", { replace: true });
    } else {
      navigate("/employee/home", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: "linear-gradient(135deg, #4261FF, #6b8cff)",
              animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
            }} />
          ))}
          <style>{`
            @keyframes navDotBounce {
              0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
              40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 font-[Pretendard]">
      <div className="mt-24 mb-10 text-center">
        <img src="/images/logo.png" alt="로고" className="mx-auto mb-3" />
        <p className="text-[15px] font-semibold text-[#19191B] tracking-[-0.02em]">
          어떤 역할로 시작할까요?
        </p>
        <p className="text-[13px] text-[#70737B] mt-1 tracking-[-0.01em]">
          계정에 연결된 매장을 선택하세요
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {accounts.map((account) => (
          <button
            key={`${account.role}-${account.storeId}`}
            onClick={() => handleSelect(account)}
            className="pressable w-full flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 text-left shadow-sm hover:border-primary hover:shadow-md transition-all"
          >
            <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 ${
              account.role === "owner" ? "bg-primary/10" : "bg-[#F3F4F6]"
            }`}>
              <span className="text-[20px]">
                {account.role === "owner" ? "👑" : "💼"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[15px] font-bold text-[#19191B] tracking-[-0.02em] truncate">
                  {account.storeName}
                </span>
                <span className={`text-[11px] font-semibold px-[7px] py-[2px] rounded-full flex-shrink-0 ${
                  account.role === "owner"
                    ? "bg-primary text-white"
                    : "bg-[#F3F4F6] text-[#70737B]"
                }`}>
                  {account.role === "owner" ? "사장님" : "직원"}
                </span>
              </div>
              <span className="text-[13px] text-[#9EA3AD] tracking-[-0.01em]">
                {account.role === "owner" ? "사장님 화면으로 이동" : "직원 화면으로 이동"}
              </span>
            </div>
            <svg className="w-4 h-4 text-[#C4C7CD] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
