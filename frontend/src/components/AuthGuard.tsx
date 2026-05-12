import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyStores } from "@/api/public";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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