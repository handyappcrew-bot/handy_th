import { useState } from "react";
import { AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";

const BUSINESS_TYPES = [
    { value: "food", label: "음식점 / 카페" },
    { value: "convenience", label: "편의점" },
    { value: "retail", label: "판매 / 매장" },
    { value: "service", label: "서비스업" },
    { value: "education", label: "교육" },
    { value: "other", label: "기타" },
];

const BusinessVerify = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [rawDigits, setRawDigits] = useState("");
    const isComplete = rawDigits.length === 10;
    const isValidFormat = /^\d{10}$/.test(rawDigits);
    const [isVerified, setIsVerified] = useState(false);
    const [isError, setIsError] = useState(false);
    const [bizFocused, setBizFocused] = useState(false);

    // 매장정보
    const [storeName, setStoreName] = useState("");
    const [storeNameFocused, setStoreNameFocused] = useState(false);
    const [address, setAddress] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [addressDetailFocused, setAddressDetailFocused] = useState(false);
    const [businessType, setBusinessType] = useState("");
    const [showTypeSheet, setShowTypeSheet] = useState(false);
    const [ownerName, setOwnerName] = useState("");
    const [ownerNameFocused, setOwnerNameFocused] = useState(false);
    const [ownerPhone, setOwnerPhone] = useState("");
    const [ownerPhoneFocused, setOwnerPhoneFocused] = useState(false);

    const formatBusinessNumber = (digits: string) => {
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setRawDigits(onlyDigits);
        if (isError) setIsError(false);
    };

    // 개발 모드 테스트용: 국세청 API 미연동 단계에서 다음 단계로 넘어가기 위한 우회 코드.
    // 운영 환경(import.meta.env.DEV === false)에서는 동작하지 않음.
    const TEST_BUSINESS_NUMBER = "0000000000";

    const handleVerify = async () => {
        if (!isValidFormat) return;

        // dev 모드 + 테스트 번호: API 호출 생략하고 즉시 인증 성공 처리
        if (import.meta.env.DEV && rawDigits === TEST_BUSINESS_NUMBER) {
            setIsError(false);
            setIsVerified(true);
            return;
        }

        try {
            const res = await fetch(`/api/owner/business/${rawDigits}`);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            if (data.match_cnt === 1) {
                setIsError(false);
                setIsVerified(true);
            } else {
                setIsVerified(false);
                setIsError(true);
            }
        } catch (e) {
            console.error("API Error:", e);
            setIsError(true);
        }
    };

    // 우편번호 조회
    const openPostcode = () => {
        // @ts-ignore
        new window.kakao.Postcode({
            oncomplete: (data: any) => setAddress(data.address),
        }).open();
    };

    const isStoreFormValid = isVerified && storeName.trim() && address.trim() && businessType && ownerName.trim() && ownerPhone.trim();

    const handleSubmit = () => {
        if (isStoreFormValid) {
            navigate("/owner/business/upload", {
                state: {
                    rawDigits: formatBusinessNumber(rawDigits),
                    storeName,
                    address,
                    addressDetail,
                    businessType,
                    ownerName,
                    ownerPhone,
                },
            });
        } else {
            toast({ description: "모든 필수 정보를 입력해주세요.", variant: "destructive", duration: 2000 });
        }
    };

    // 입력 필드 공통 스타일 (회원가입 패턴)
    const fieldClass = (focused: boolean, errored?: boolean) => {
        const border = errored
            ? "border-input-error"
            : focused
                ? "border-input-focus"
                : "border-input";
        return `w-full h-[52px] rounded-xl border-2 bg-background px-4 text-[16px] transition-colors ${border}`;
    };

    // 인증 완료된 readonly input 스타일 (회원가입 CodeVerify와 동일)
    const verifiedFieldStyle: React.CSSProperties = {
        outline: 'none',
        boxShadow: 'none',
        borderColor: '#DBDCDF',
        backgroundColor: '#F7F7F8',
        color: '#AAB4BF',
    };

    const isDev = import.meta.env.DEV;

    const selectedTypeLabel = BUSINESS_TYPES.find((t) => t.value === businessType)?.label;

    return (
        <>
            <PageLayout
                stickyHeader
                title={
                    <>
                        <h2 className="text-[22px] font-bold leading-tight text-foreground">등록할 매장의</h2>
                        <h2 className="text-[22px] font-bold leading-tight text-foreground">사업자 인증을 진행할게요</h2>
                    </>
                }
                onBack={() => navigate(-1)}
                bottom={
                    isVerified ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!isStoreFormValid}
                            className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isStoreFormValid
                                ? "bg-primary text-primary-foreground"
                                : "btn-disabled"
                                }`}
                        >
                            사업자 등록증 업로드하기
                        </button>
                    ) : (
                        <button
                            onClick={handleVerify}
                            disabled={!isComplete}
                            className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${isComplete
                                ? "bg-primary text-primary-foreground"
                                : "btn-disabled"
                                }`}
                        >
                            사업자 번호 조회하기
                        </button>
                    )
                }
            >
                {/* 사업자 번호 */}
                <div>
                    <label className="text-[15px] font-medium text-foreground">
                        사업자 번호 <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={formatBusinessNumber(rawDigits)}
                        onChange={handleChange}
                        onFocus={() => setBizFocused(true)}
                        onBlur={() => setBizFocused(false)}
                        placeholder="사업자 번호 (숫자만 입력)"
                        readOnly={isVerified}
                        style={isVerified ? verifiedFieldStyle : { outline: 'none', boxShadow: 'none' }}
                        className={`mt-2 ${isVerified
                            ? 'w-full h-[52px] rounded-xl border-2 px-4 text-[16px] transition-colors'
                            : fieldClass(bizFocused, isError)
                            }`}
                    />
                    {isVerified && (
                        <div className="mt-2 flex items-center gap-1.5" style={{ color: '#10C97D' }}>
                            <CheckCircle size={16} />
                            <span className="text-[13px]">조회되었어요</span>
                        </div>
                    )}
                    {isError && (
                        <div className="mt-2 flex items-center gap-1.5 text-destructive">
                            <AlertCircle size={16} />
                            <span className="text-[13px]">올바르지 않은 사업자 번호 형식이에요</span>
                        </div>
                    )}
                    {isDev && !isVerified && (
                        <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
                            <p className="text-[12px] text-primary">
                                <strong>[개발 모드]</strong> 테스트 사업자 번호: <code className="font-mono font-bold">000-00-00000</code>
                            </p>
                        </div>
                    )}
                </div>

                {/* 매장 정보 폼: 인증 통과 후에만 노출 */}
                {isVerified && (
                    <>
                        <div className="my-6 border-t border-border" />
                        <h3 className="text-[18px] font-bold text-foreground mb-4">매장 정보</h3>

                        {/* 매장명 */}
                        <div className="mt-2">
                            <label className="text-[15px] font-medium text-foreground">
                                매장명 <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                onFocus={() => setStoreNameFocused(true)}
                                onBlur={() => setStoreNameFocused(false)}
                                placeholder="매장명 입력"
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`mt-2 ${fieldClass(storeNameFocused)}`}
                            />
                        </div>

                        {/* 주소 */}
                        <div className="mt-5">
                            <label className="text-[15px] font-medium text-foreground">
                                주소 <span className="text-destructive">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={openPostcode}
                                className="pressable mt-2 flex w-full items-center justify-between rounded-xl border-2 border-input bg-background px-4 h-[52px] text-[16px]"
                            >
                                <span className={address ? "text-foreground" : "text-[#AAB4BF]"}>
                                    {address || "주소 검색"}
                                </span>
                                <ChevronDown size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* 상세 주소 */}
                        <div className="mt-5">
                            <label className="text-[15px] font-medium text-foreground">상세 주소</label>
                            <input
                                type="text"
                                value={addressDetail}
                                onChange={(e) => setAddressDetail(e.target.value)}
                                onFocus={() => setAddressDetailFocused(true)}
                                onBlur={() => setAddressDetailFocused(false)}
                                placeholder="상세 주소 입력"
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`mt-2 ${fieldClass(addressDetailFocused)}`}
                            />
                        </div>

                        {/* 업종 */}
                        <div className="mt-5">
                            <label className="text-[15px] font-medium text-foreground">
                                업종 <span className="text-destructive">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowTypeSheet(true)}
                                className="pressable mt-2 flex w-full items-center justify-between rounded-xl border-2 border-input bg-background px-4 h-[52px] text-[16px]"
                            >
                                <span className={businessType ? "text-foreground" : "text-[#AAB4BF]"}>
                                    {selectedTypeLabel || "업종 선택"}
                                </span>
                                <ChevronDown size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* 대표자명 */}
                        <div className="mt-5">
                            <label className="text-[15px] font-medium text-foreground">
                                대표자명 <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                onFocus={() => setOwnerNameFocused(true)}
                                onBlur={() => setOwnerNameFocused(false)}
                                placeholder="대표자명 입력"
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`mt-2 ${fieldClass(ownerNameFocused)}`}
                            />
                        </div>

                        {/* 대표번호 */}
                        <div className="mt-5 mb-6">
                            <label className="text-[15px] font-medium text-foreground">
                                대표번호 <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={ownerPhone}
                                onChange={(e) => setOwnerPhone(e.target.value)}
                                onFocus={() => setOwnerPhoneFocused(true)}
                                onBlur={() => setOwnerPhoneFocused(false)}
                                placeholder="대표번호 입력"
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`mt-2 ${fieldClass(ownerPhoneFocused)}`}
                            />
                        </div>
                    </>
                )}
            </PageLayout>

            {/* 업종 선택 바텀시트 */}
            {showTypeSheet && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end touch-none sheet-overlay">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowTypeSheet(false)} />
                    <div className="relative rounded-t-2xl bg-background px-5 pb-8 pt-6">
                        <h3 className="text-[18px] font-bold text-foreground mb-5">업종을 선택해주세요</h3>
                        {BUSINESS_TYPES.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setBusinessType(t.value);
                                    setShowTypeSheet(false);
                                }}
                                className={`pressable flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-[16px] mb-1 ${businessType === t.value
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-foreground"
                                    }`}
                            >
                                {t.label}
                                {businessType === t.value && <CheckCircle size={20} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default BusinessVerify;
