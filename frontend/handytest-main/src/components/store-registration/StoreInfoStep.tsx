import { ChevronLeft, MapPin } from "lucide-react";
import Map from "@/components/Map";

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
    <div className="flex flex-col min-h-screen px-5 pt-4 pb-8">
      {/* Back button */}
      <button onClick={onBack} className="self-start p-0 mb-4">
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>

      {/* Title */}
      <h1 className="text-[22px] font-bold leading-[1.4] text-foreground mb-6">
        가입 신청할
        <br />
        매장 정보를 확인해 주세요
      </h1>

      {/* Divider */}
      <div className="w-full h-px bg-border mb-6" />

      {/* Store Info */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="w-5 h-5 text-foreground" />
          <span className="text-[16px] font-semibold text-foreground">
            {storeInfo.name}
          </span>
        </div>
        <p className="text-[14px] text-muted-foreground leading-[1.6]">
          {storeInfo.address}
        </p>
        <p className="text-[14px] text-muted-foreground">
          {storeInfo.phone}
        </p>
      </div>

      {/* Map Placeholder */}
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-border mb-6">
        <Map lat={storeInfo.lat} lng={storeInfo.lng} />
      </div>

      <div className="flex-1" />

      {/* Button */}
      <button
        onClick={onSelect}
        className="w-full h-[54px] rounded-xl text-[16px] font-semibold bg-[hsl(234,80%,63%)] text-white"
      >
        매장 선택하기
      </button>
    </div>
  );
};

export default StoreInfoStep;