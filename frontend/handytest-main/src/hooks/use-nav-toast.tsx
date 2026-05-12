import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface NavigateOptions {
  /** 로딩 스피너 노출 여부 (기본 false) */
  showLoading?: boolean;
  /** true: 경로 중복 무관 항상 로딩+토스트 노출 / false(기본): 경로별 1회만 */
  forceAll?: boolean;
  /** react-router navigate state */
  state?: unknown;
}

interface NavToastContextValue {
  showNavToast: (message: string) => void;
  navigateTo: (path: string, message?: string, options?: NavigateOptions) => void;
}

const NavToastContext = createContext<NavToastContextValue | null>(null);

export const NavToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkKey, setCheckKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownPathsRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  const showNavToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCheckKey((k) => k + 1);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setMessage(null), 350);
    }, 2400);
  }, []);

  const navigateTo = useCallback((
    path: string,
    message?: string,
    { showLoading = false, forceAll = false, state }: NavigateOptions = {}
  ) => {
    // 토스트 노출 여부: forceAll이면 항상, 아니면 경로 첫 방문만
    const shouldShowToast = !!message && (forceAll || !shownPathsRef.current.has(path));
    // 로딩 노출 여부: forceAll이면 항상, 아니면 showLoading 옵션 따름
    const shouldLoad = forceAll || showLoading;

    if (!forceAll && shouldShowToast) shownPathsRef.current.add(path);

    if (shouldLoad) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (shouldShowToast) showNavToast(message!);
        navigate(path, { state });
      }, 300);
    } else {
      if (shouldShowToast) showNavToast(message!);
      navigate(path, { state });
    }
  }, [navigate, showNavToast]);

  return (
    <NavToastContext.Provider value={{ showNavToast, navigateTo }}>
      {children}

      {/* 네비게이션 토스트 */}
      {message && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: '50%',
            transform: `translateX(-50%) translateY(${visible ? '0px' : '-16px'})`,
            opacity: visible ? 1 : 0,
            transition: 'opacity 220ms ease, transform 280ms cubic-bezier(0.34,1.4,0.64,1)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
            borderRadius: '9999px',
            padding: '8px 18px 8px 8px',
            boxShadow: '0 8px 32px rgba(66,97,255,0.25), 0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(66,97,255,0.3)',
          }}>
            {/* 체크 아이콘 — 팝 + 링 펄스 + 체크 드로우 */}
            <div
              key={checkKey}
              style={{
                position: 'relative',
                width: '30px', height: '30px',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* 링 펄스 */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'rgba(66,97,255,0.35)',
                animation: 'navRingPulse 0.6s ease-out both',
              }} />
              {/* 원형 배경 팝 */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
                animation: 'navCheckPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path
                    d="M1.5 5.5L5.5 9.5L12.5 1.5"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 18,
                      strokeDashoffset: 18,
                      animation: 'navCheckDraw 0.35s ease-out 0.15s forwards',
                    }}
                  />
                </svg>
              </div>
            </div>
            <span style={{
              fontSize: '14px', fontWeight: 600,
              color: '#FFFFFF', letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              {message}
            </span>
          </div>
        </div>
      )}

      {/* 로딩 스피너 오버레이 */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          backgroundColor: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(1.5px)',
        }}>
          <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
                  animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes navDotBounce {
          0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
          40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
        }
        @keyframes navCheckPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes navRingPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes navCheckDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </NavToastContext.Provider>
  );
};

export const useNavToast = () => {
  const ctx = useContext(NavToastContext);
  if (!ctx) throw new Error("useNavToast must be used within NavToastProvider");
  return ctx;
};
