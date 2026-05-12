import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastBannerProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

const ToastBanner = ({ message, visible, onClose }: ToastBannerProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-toast px-4 py-3.5 mb-3 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="text-[15px] text-toast-foreground">{message}</span>
      <button onClick={() => { setShow(false); setTimeout(onClose, 300); }}>
        <X size={18} className="text-toast-foreground" />
      </button>
    </div>
  );
};

export default ToastBanner;
