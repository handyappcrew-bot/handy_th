import { useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusinessUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
}

const BusinessUploadSheet = ({ open, onOpenChange, onFileSelected }: BusinessUploadSheetProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ description: "5MB 이하의 파일만 업로드할 수 있습니다.", variant: "destructive", duration: 2000 });
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast({ description: "JPG, JPEG, PNG 파일만 업로드할 수 있습니다.", variant: "destructive", duration: 2000 });
      return;
    }
    onFileSelected(file);
    onOpenChange(false);
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFile} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/jpeg,image/jpg,image/png" capture="environment" onChange={handleFile} className="hidden" />
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => onOpenChange(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>사업자 등록증 업로드하기</h2>
                <button className="pressable p-1" onClick={() => onOpenChange(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '20px' }}>
                {[
                  { label: '앨범에서 선택하기', ref: fileInputRef },
                  { label: '카메라 촬영하기', ref: cameraInputRef },
                ].map(({ label, ref }) => (
                  <button key={label} onClick={() => ref.current?.click()} className="pressable"
                    style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', paddingLeft: '4px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BusinessUploadSheet;
