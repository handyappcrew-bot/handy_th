import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Info } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import PlaceholderDocument from "@/components/PlaceholderDocument";
import { useLocation } from "react-router-dom";

type Screen = "empty" | "preview" | "submitted";

const BusinessVerifyUpload = () => {
  const location = useLocation();
  const { rawDigits, storeName, address, businessType, ownerName, ownerPhone } = location.state || {};
  const [screen, setScreen] = useState<Screen>("empty");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("5MB 이내 파일만 업로드할 수 있어요.");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      alert("JPG, JPEG, PNG 파일만 업로드할 수 있어요.");
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScreen("preview");
    setSheetOpen(false);
  };

  const handleReupload = () => {
    setScreen("empty");
    setImageUrl(null);
  };

  const handleSubmit = async () => {
    if (!imageUrl) return
    const file = fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0];
    if (!file) return
    console.log(file);

    const formData = new FormData();
    formData.append("rawDigits", rawDigits);
    formData.append("image", file);
    formData.append("storeName", storeName);
    formData.append("address", address);
    formData.append("businessType", businessType);
    formData.append("ownerName", ownerName);
    formData.append("ownerPhone", ownerPhone);

    const res = await fetch("/api/owner/stores", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      setScreen("submitted")
    }

    if (!res.ok) {
      const err = await res.json();

      if (res.status === 500) {
        alert(err.detail || "데이터 저장 중 오류가 발생했습니다.")
      }
    }
  }

  return (
    <div className="h-full bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === "empty" ? (
          <motion.div
            key="empty"
            className="flex-1 flex flex-col px-6 pt-4 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <button className="self-start p-1 -ml-1 text-foreground mb-4">
              <ChevronLeft size={28} />
            </button>

            <h1 className="text-[22px] font-bold leading-snug text-foreground mb-12">
              매장 등록을 위해<br />
              사업자 등록증을 업로드해 주세요
            </h1>

            {/* Placeholder document */}
            <div className="flex-1 flex items-center justify-center">
              <PlaceholderDocument />
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
              <Info size={16} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                5mb 이내 JPG, JPEG, PNG<br />
                이미지 파일만 업로드 할 수 있어요
              </p>
            </div>

            {/* Upload button */}
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold"
            >
              사업자 등록증 업로드하기
            </button>
          </motion.div>
        ) : screen === "preview" ? (
          <motion.div
            key="preview"
            className="flex-1 flex flex-col px-6 pt-12 pb-8"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.05 } }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-[22px] font-bold leading-snug text-foreground text-center mb-10">
              업로드한 사업자 등록증을<br />
              핸디가 확인하고 있어요
            </h1>

            {/* Image preview */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-[320px] rounded-2xl overflow-hidden border border-border bg-muted shadow-sm">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="사업자 등록증"
                    className="w-full object-contain"
                  />
                )}
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-1.5 mt-6">
                <Info size={16} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  5mb 이내 JPG, JPEG, PNG<br />
                  이미지 파일만 업로드 할 수 있어요
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleReupload}
                className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground text-base font-semibold"
              >
                다시 업로드하기
              </button>
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold"
              >
                등록하기
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="submitted"
            className="flex-1 flex flex-col px-6 pt-12 pb-8"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.05 } }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-[22px] font-bold leading-snug text-foreground text-center mb-10">
              업로드한 사업자 등록증을<br />
              핸디가 확인하고 있어요
            </h1>

            <div className="flex-1 flex flex-col items-center justify-center">
              <PlaceholderDocument />

              <div className="flex flex-col items-center gap-1 mt-6">
                <div className="flex items-center gap-1.5">
                  <Info size={16} className="text-primary" />
                  <p className="text-sm font-medium text-primary">
                    관리자 승인이 필요해요
                  </p>
                </div>
                <p className="text-sm text-primary text-center">
                  승인까지 최대 1~2일 걸릴 수 있어요
                </p>
                <p className="text-sm text-primary text-center">
                  완료되는 즉시 알림으로 알려드릴게요
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="사업자 등록증 업로드하기"
      >
        <div className="space-y-1">
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setSheetOpen(false);
            }}
            className="w-full text-left py-4 px-4 rounded-xl text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
          >
            앨범에서 선택하기
          </button>
          <button
            onClick={() => {
              cameraInputRef.current?.click();
              setSheetOpen(false);
            }}
            className="w-full text-left py-4 px-4 rounded-xl text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
          >
            카메라 촬영하기
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default BusinessVerifyUpload;
