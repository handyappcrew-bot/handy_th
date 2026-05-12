import { useRef } from "react";
import { X, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface BusinessUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
}

const BusinessUploadSheet = ({ open, onOpenChange, onFileSelected }: BusinessUploadSheetProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("5MB 이하의 파일만 업로드할 수 있습니다.");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      alert("JPG, JPEG, PNG 파일만 업로드할 수 있습니다.");
      return;
    }
    onFileSelected(file);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <DrawerHeader className="flex flex-row items-center justify-between px-6 pb-2">
          <DrawerTitle className="text-lg font-bold">사업자 등록증 업로드하기</DrawerTitle>
          <DrawerClose className="flex h-8 w-8 items-center justify-center rounded-full">
            <X className="h-5 w-5 text-foreground" />
          </DrawerClose>
        </DrawerHeader>

        <div className="px-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-between rounded-xl py-4 text-base text-foreground transition-colors"
          >
            앨범에서 선택하기
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex w-full items-center justify-between rounded-xl py-4 text-base text-foreground transition-colors"
          >
            카메라 촬영하기
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFile}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </DrawerContent>
    </Drawer>
  );
};

export default BusinessUploadSheet;
