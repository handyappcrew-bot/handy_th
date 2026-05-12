import { useState } from "react";
import StoreCodeStep from "@/components/store-registration/StoreCodeStep";
import StoreInfoStep from "@/components/store-registration/StoreInfoStep";
import BankAccountStep from "@/components/store-registration/BankAccountStep";
import RegistrationComplete from "@/components/store-registration/RegistrationComplete";

const StoreRegistration = () => {
  const [step, setStep] = useState(1);
  const [storeInfo, setStoreInfo] = useState<{
    id: number;
    name: string;
    address: string;
    phone: string;
    lat: number;
    lng: number;
  } | null>(null);

  // 매장 코드 인증 성공 시 실행
  const handleCodeVerified = (id: number, code: string, info: any) => {
    if (!info) {
      console.error("백엔드에서 상세 정보를 가져오지 못했습니다.");
      return;
    }

    // 인자로 받은 id를 직접 사용하여 객체를 생성합니다.
    setStoreInfo({
      ...info,
      id: id // info.id 대신 인자로 넘어온 id를 사용하세요.
    });

    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStoreSelect = () => {
    setStep(3);
  };

  const handleComplete = async (data: { bank: string; accountHolder: string; accountNumber: string }) => {
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background max-w-[375px] mx-auto">
      {step === 1 && (
        <StoreCodeStep
          onBack={handleBack}
          onNext={() => setStep(2)}
          onCodeVerified={handleCodeVerified}
        />
      )}
      {step === 2 && storeInfo && (
        <StoreInfoStep
          storeInfo={storeInfo}
          onBack={handleBack}
          onSelect={handleStoreSelect}
        />
      )}
      {step === 3 && (
        <BankAccountStep
          store_id={storeInfo.id}
          onBack={handleBack}
          onSubmit={handleComplete}
        />
      )}
      {step === 4 && <RegistrationComplete />}
    </div>
  );
};

export default StoreRegistration;
