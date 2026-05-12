import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

// 아이콘: 체크 팝 + 획 드로우
const ToastIcon = ({ variant }: { variant?: string }) => {
  const color = variant === "destructive" ? "#FF3D3D" : "#4261FF";
  return (
    <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
      {/* 글로우 링 */}
      <div style={{
        position: 'absolute', inset: '-2px', borderRadius: '50%',
        background: `${color}22`,
        animation: 'toastGlow 0.5s ease-out both',
      }} />
      {/* 원형 배경 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        backgroundColor: `${color}1A`,
        border: `1.5px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'toastIconPop 0.35s cubic-bezier(0.34,1.5,0.64,1) both',
      }}>
        {variant === "destructive" ? (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 2.5L10.5 10.5M10.5 2.5L2.5 10.5"
              stroke={color} strokeWidth="2" strokeLinecap="round"
              style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'toastDraw 0.28s ease-out 0.1s forwards' }}
            />
          </svg>
        ) : (
          <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
            <path d="M1.5 5.5L5.2 9L11.5 1.5"
              stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 18, strokeDashoffset: 18, animation: 'toastDraw 0.3s ease-out 0.12s forwards' }}
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastIcon variant={variant} />
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />

      <style>{`
        @keyframes toastIn {
          0%   { opacity: 0; transform: translateY(-12px) scale(0.96); }
          60%  { opacity: 1; transform: translateY(2px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.97); }
        }
        @keyframes toastIconPop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes toastGlow {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes toastDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </ToastProvider>
  );
}