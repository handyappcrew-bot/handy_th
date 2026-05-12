import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  bottom?: React.ReactNode;
  toast?: React.ReactNode;
}

const PageLayout = ({ children, title, subtitle, onBack, bottom, toast }: PageLayoutProps) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Safe area top padding for mobile app */}
      <div className="pt-14 px-5">
        <button onClick={handleBack} className="mb-4 -ml-1 text-primary">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>

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
