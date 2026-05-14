import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyStores } from "@/api/public";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 로컬 개발 환경에서는 인증 체크 생략 (백엔드 없이 UI 확인 가능)
    if (import.meta.env.DEV) {
      setChecked(true);
      return;
    }

    const check = async () => {
      try {
        await getMyStores();
      } catch {
        navigate("/", { replace: true });
      } finally {
        setChecked(true);
      }
    };
    check();
  }, []);

  if (!checked) return null;
  return <>{children}</>;
};

export default AuthGuard;