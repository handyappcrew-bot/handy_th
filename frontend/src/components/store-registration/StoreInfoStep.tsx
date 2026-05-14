import { MapPin } from "lucide-react";
import Map from "@/components/Map";
import PageLayout from "@/components/PageLayout";

interface StoreInfoStepProps {
  storeInfo: {
    id: number;
    name: string;
    address: string;
    phone: string;
    lat: number;
    lng: number;
  };
  onBack: () => void;
  onSelect: () => void;
}

const StoreInfoStep = ({ storeInfo, onBack, onSelect }: StoreInfoStepProps) => {
  return (
    <PageLayout
      stickyHeader
      onBack={onBack}
      title={
        <>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">가입 신청할</h2>
          <h2 className="text-[22px] font-bold leading-tight text-foreground">매장 정보를 확인해 주세요</h2>
        </>
      }
      bottom={
        <button
          onClick={onSelect}
          className="pressable w-full rounded-2xl py-4 text-[17px] font-semibold bg-primary text-primary-foreground"
        >
          매장 선택하기
        </button>
      }
    >
      {/* 매장 정보 */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="w-5 h-5 text-foreground" />
          <span className="text-[16px] font-semibold text-foreground">{storeInfo.name}</span>
        </div>
        <p className="text-[14px] text-muted-foreground leading-[1.6]">{storeInfo.address}</p>
        <p className="text-[14px] text-muted-foreground">{storeInfo.phone}</p>
      </div>

      {/* 지도 — 다른 입력 섹션들과 동일하게 mt-5 */}
      <div className="mt-5 w-full aspect-[4/3] rounded-xl overflow-hidden border border-border">
        <Map lat={storeInfo.lat} lng={storeInfo.lng} />
      </div>
    </PageLayout>
  );
};

export default StoreInfoStep;
