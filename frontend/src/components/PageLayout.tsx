import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  bottom?: React.ReactNode;
  toast?: React.ReactNode;
  /**
   * 상단 sticky 헤더 타이틀. 지정하면 sticky 헤더 + 디바이더가 활성화되고 텍스트로 노출됩니다.
   */
  headerTitle?: string;
  /**
   * headerTitle 없이도 sticky 헤더 모드를 켭니다 (백 버튼만 노출하고 헤더 텍스트는 비움).
   */
  stickyHeader?: boolean;
  /**
   * sticky 헤더 모드일 때 백 버튼 숨김 (예: 회원가입 완료 후 진입한 회원 유형 선택 화면).
   */
  hideBackButton?: boolean;
}

const PageLayout = ({ children, title, subtitle, onBack, bottom, toast, headerTitle, stickyHeader, hideBackButton }: PageLayoutProps) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  const useStickyHeader = headerTitle !== undefined || stickyHeader;

  if (useStickyHeader) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2 min-h-[48px]"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {!hideBackButton && (
            <button onClick={handleBack} className="pressable p-1" aria-label="뒤로가기">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
          )}
          {headerTitle && (
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
              {headerTitle}
            </h1>
          )}
        </div>
        {/* 디바이더는 headerTitle이 있을 때(=회원가입 5개 화면)에만 노출. 사장/직원 인증 플로우는 헤더 텍스트 없으니 디바이더도 제외 */}
        {headerTitle && <div className="border-b border-border" />}

        {/* Body */}
        <div className="flex-1 px-5 pt-5">
          <div className="mb-2">
            {typeof title === "string" ? (
              <h2 className="text-[22px] font-bold leading-tight text-foreground">{title}</h2>
            ) : (
              title
            )}
          </div>
          {subtitle && (
            <p className="text-[14px] text-muted-foreground mb-6">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>

        {(bottom || toast) && (
          <div className="mt-auto px-5 pb-8">
            {toast}
            {bottom}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Safe area top padding for mobile app */}
      <div className="pt-14 px-5">
        {!hideBackButton && (
          <button onClick={handleBack} className="pressable mb-4 -ml-1 text-primary">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
        )}

        <div className="mb-2">
          {typeof title === "string" ? (
            <h1 className="text-[26px] font-bold leading-tight text-foreground">{title}</h1>
          ) : (
            title
          )}
        </div>

        {subtitle && (
          <p className="text-[15px] text-muted-foreground mb-6">{subtitle}</p>
        )}

        <div className="mt-6">{children}</div>
      </div>

      {/* Bottom fixed area */}
      {(bottom || toast) && (
        <div className="mt-auto px-5 pb-8">
          {toast}
          {bottom}
        </div>
      )}
    </div>
  );
};

export default PageLayout;
