import { useState } from "react";
import { ChevronLeft, CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const BusinessVerify = () => {
    const navigate = useNavigate();
    const [rawDigits, setRawDigits] = useState("");
    const isComplete = rawDigits.length === 10;
    const isValidFormat = /^\d{10}$/.test(rawDigits);
    const [isVerified, setIsVerified] = useState(false);
    const [isError, setIsError] = useState(false);

    // 매장정보 다루는 변수들
    const [storeName, setStoreName] = useState("");
    const [address, setAddress] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");

    // 사업자 번호 포매팅 함수
    const formatBusinessNumber = (digits: string) => {
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    };

    const handleChange = (e) => {
        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setRawDigits(onlyDigits);
    };

    const handleVerify = async () => {
        if (!isValidFormat) return;

        try {
            const res = await fetch(`/api/owner/business/${rawDigits}`);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();

            // 조회 성공
            if (data.match_cnt === 1) {
                setIsError(false);
                setIsVerified(true);
            } else {
                setIsVerified(false);
                setIsError(true);
            }

        } catch (e) {
            console.error("API Error:", e);
        }
    };

    // 우편번호 조회 함수
    const openPostcode = () => {
        new window.kakao.Postcode({
            oncomplete: function (data) {
                setAddress(data.address);
            },
        }).open();
    };

    const handleSubmit = () => {
        if (storeName && address && businessType && ownerName && ownerPhone) {
            navigate("/owner/business/upload", {
                state: { rawDigits: formatBusinessNumber(rawDigits), storeName, address, businessType, ownerName, ownerPhone }
            });
        } else {
            alert("모든 필수 정보를 입력해주세요.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
            {/* Header */}
            <div className="px-4 pt-4">
                <button className="p-1 -ml-1" aria-label="뒤로가기">
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
            </div>

            {/* Title */}
            <div className="px-6 pt-6 pb-8">
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                    등록할 매장의
                    <br />
                    사업자 인증을 진행할게요
                </h1>
            </div>

            {/* Form */}
            <div className="px-6 flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">
                    사업자 번호 <span className="text-destructive">*</span>
                </label>

                <input
                    type="text"
                    inputMode="numeric"
                    value={formatBusinessNumber(rawDigits)}
                    onChange={handleChange}
                    placeholder="사업자 번호 (숫자만 입력)"
                    className={`w-full px-4 py-4 rounded-lg border bg-background text-foreground text-base outline-none transition-colors placeholder:text-muted-foreground/60 ${isVerified
                        ? "border-success ring-1 ring-success"
                        : isError
                            ? "border-destructive ring-1 ring-destructive"
                            : "border-input"
                        }`}
                />

                {/* Status messages */}
                {isVerified && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <CircleCheck className="h-5 w-5 text-success" />
                        <span className="text-sm text-success font-medium">조회되었어요</span>
                    </div>
                )}

                {isError && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <CircleAlert className="h-5 w-5 text-destructive" />
                        <span className="text-sm text-destructive font-medium">올바르지 않은 사업자 번호 형식이에요</span>
                    </div>
                )}

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={!isComplete}
                    className={`w-full mt-6 py-4 rounded-xl text-base font-semibold transition-colors ${isComplete
                        ? "bg-primary text-primary-foreground active:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                >
                    사업자 번호 조회하기
                </button>

                {isVerified && (
                    <>
                        <div className="border-t border-border my-6" />
                        <h2 className="text-lg font-bold text-foreground mb-6">매장 정보</h2>

                        <div className="space-y-5">
                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    매장명 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="매장명 입력"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    주소 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    onClick={openPostcode}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="주소 입력"
                                    className="h-12 text-base"
                                    readOnly
                                />
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    상세 주소
                                </Label>
                                <Input
                                    value={addressDetail}
                                    onChange={(e) => setAddressDetail(e.target.value)}
                                    placeholder="상세 주소 입력"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    업종 <span className="text-destructive">*</span>
                                </Label>
                                <Select value={businessType} onValueChange={setBusinessType}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="업종 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="food">음식점 / 카페</SelectItem>
                                        <SelectItem value="cafe">편의점</SelectItem>
                                        <SelectItem value="retail">판매 / 매장</SelectItem>
                                        <SelectItem value="service">서비스업</SelectItem>
                                        <SelectItem value="education">교육</SelectItem>
                                        <SelectItem value="other">기타</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    대표자명 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="대표자명 입력"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    대표번호 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={ownerPhone}
                                    onChange={(e) => setOwnerPhone(e.target.value)}
                                    placeholder="대표번호 입력"
                                    className="h-12 text-base"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isComplete}
                            className={`w-full mt-6 py-6 rounded-xl text-base font-semibold transition-colors ${isComplete
                                ? "bg-primary text-primary-foreground active:opacity-90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                }`}
                        >
                            사업자 등록증 업로드하기
                        </Button>
                    </>
                )}

            </div>
        </div>
    );
};

export default BusinessVerify;
