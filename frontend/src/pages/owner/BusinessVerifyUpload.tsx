import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlaceholderDocument from "@/components/PlaceholderDocument";
import PageLayout from "@/components/PageLayout";
import BottomSheet from "@/components/BottomSheet";
import { useToast } from "@/hooks/use-toast";

type Screen = "empty" | "preview" | "submitted";

const BusinessVerifyUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rawDigits, storeName, address, addressDetail, businessType, ownerName, ownerPhone } = (location.state as any) || {};

  const [screen, setScreen] = useState<Screen>("empty");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ description: "5MB 이내 파일만 업로드할 수 있어요.", variant: "destructive", duration: 2000 });
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast({ description: "JPG, JPEG, PNG 파일만 업로드할 수 있어요.", variant: "destructive", duration: 2000 });
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
    if (!imageUrl) return;
    const file = fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("rawDigits", rawDigits);
    formData.append("image", file);
    formData.append("storeName", storeName);
    formData.append("address", address);
    if (addressDetail) formData.append("addressDetail", addressDetail);
    formData.append("businessType", businessType);
    formData.append("ownerName", ownerName);
    formData.append("ownerPhone", ownerPhone);

    const res = await fetch("/api/owner/stores", { method: "POST", body: formData });

    if (res.ok) {
      setScreen("submitted");
      return;
    }

    try {
      const err = await res.json();
      toast({ description: err.detail || "데이터 저장 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
    } catch {
      toast({ description: "데이터 저장 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  // 화면별 렌더링
  if (screen === "empty") {
    return (
      <>
        <PageLayout
          stickyHeader
          onBack={() => navigate(-1)}
          title={
            <>
              <h2 className="text-[22px] font-bold leading-tight text-foreground">매장 등록을 위해</h2>
              <h2 className="text-[22px] font-bold leading-tight text-foreground">사업자 등록증을 업로드해 주세요</h2>
            </>
          }
          bottom={
            <button
              onClick={() => setSheetOpen(true)}
              className="pressable w-full rounded-2xl py-4 text-[17px] font-semibold bg-primary text-primary-foreground"
            >
              사업자 등록증 업로드하기
            </button>
          }
        >
          <div className="flex flex-col items-center">
            <div className="flex w-full items-center justify-center py-8">
              <PlaceholderDocument />
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-muted-foreground">
              <img src="/images/icon/small-notice.png" alt="" aria-hidden="true" width={16} height={16} draggable={false} />
              <span className="text-[13px]">5MB 이내 JPG, JPEG, PNG</span>
            </div>
            <p className="text-[13px] text-muted-foreground">이미지 파일만 업로드 할 수있어요</p>
          </div>
        </PageLayout>

        {/* hidden inputs */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleFile} />
        <input ref={cameraInputRef} type="file" accept="image/jpeg,image/jpg,image/png" capture="environment" className="hidden" onChange={handleFile} />

        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="사업자 등록증 업로드하기">
          <div className="space-y-1">
            <button
              onClick={() => { fileInputRef.current?.click(); setSheetOpen(false); }}
              className="pressable w-full text-left py-4 px-4 rounded-xl text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
            >
              앨범에서 선택하기
            </button>
            <button
              onClick={() => { cameraInputRef.current?.click(); setSheetOpen(false); }}
              className="pressable w-full text-left py-4 px-4 rounded-xl text-[15px] font-medium text-foreground hover:bg-secondary transition-colors"
            >
              카메라 촬영하기
            </button>
          </div>
        </BottomSheet>
      </>
    );
  }

  if (screen === "preview") {
    return (
      <>
        <PageLayout
          stickyHeader
          onBack={handleReupload}
          title={
            <>
              <h2 className="text-[22px] font-bold leading-tight text-foreground">업로드한 사업자 등록증을</h2>
              <h2 className="text-[22px] font-bold leading-tight text-foreground">확인해 주세요</h2>
            </>
          }
          bottom={
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReupload}
                className="pressable w-full rounded-2xl py-4 text-[17px] font-semibold bg-secondary text-secondary-foreground"
              >
                다시 업로드하기
              </button>
              <button
                onClick={handleSubmit}
                className="pressable w-full rounded-2xl py-4 text-[17px] font-semibold bg-primary text-primary-foreground"
              >
                등록하기
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[320px] rounded-2xl overflow-hidden border border-border bg-muted shadow-sm">
              {imageUrl && <img src={imageUrl} alt="사업자 등록증" className="w-full object-contain" />}
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-muted-foreground">
              <img src="/images/icon/small-notice.png" alt="" aria-hidden="true" width={16} height={16} draggable={false} />
              <span className="text-[13px]">5MB 이내 JPG, JPEG, PNG</span>
            </div>
            <p className="text-[13px] text-muted-foreground">이미지 파일만 업로드 할 수있어요</p>
          </div>
        </PageLayout>
      </>
    );
  }

  // submitted
  return (
    <PageLayout
      stickyHeader
      hideBackButton
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground text-center">업로드한 사업자 등록증을</h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground text-center">핸디가 확인하고 있어요</h2>
        </>
      }
    >
      <div className="flex flex-col items-center mt-8">
        <PlaceholderDocument />
        <div className="mt-8 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <img src="/images/icon/small-notice.png" alt="" aria-hidden="true" width={16} height={16} draggable={false} />
            <p className="text-[14px] font-medium" style={{ color: '#7488FE' }}>관리자 승인이 필요해요</p>
          </div>
          <p className="text-[14px] text-center" style={{ color: '#7488FE' }}>승인까지 최대 1~2일 걸릴 수 있어요</p>
          <p className="text-[14px] text-center" style={{ color: '#7488FE' }}>완료되는 즉시 알림으로 알려드릴게요</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessVerifyUpload;
