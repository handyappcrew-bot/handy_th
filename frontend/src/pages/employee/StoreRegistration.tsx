import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreCodeStep from "@/components/store-registration/StoreCodeStep";
import StoreInfoStep from "@/components/store-registration/StoreInfoStep";
import BankAccountStep from "@/components/store-registration/BankAccountStep";
import RegistrationComplete from "@/components/store-registration/RegistrationComplete";

const StoreRegistration = () => {
  const navigate = useNavigate();
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
    } else {
      // step 1에서는 이전 화면(/onboarding/member-type 등)으로 복귀
      navigate(-1);
    }
  };

  const handleStoreSelect = () => {
    setStep(3);
  };

  const handleComplete = async (data: { bank: string; accountHolder: string; accountNumber: string }) => {
    setStep(4);
  };

  // outer wrapper(max-w-[375px]) 제거 — 각 step의 PageLayout 이 자체 max-w-lg + mx-auto + px-5 를
  //   관리하므로 사장 사업자 인증 플로우와 동일한 좌우 마진/폭으로 렌더됨.
  return (
    <>
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
    </>
  );
};

export default StoreRegistration;
