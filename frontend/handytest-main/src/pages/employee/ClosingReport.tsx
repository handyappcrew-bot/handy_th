import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { addClosingReport, checkClosingStatus } from "@/api/employee";

const ClosingReport = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [cardSales, setCardSales] = useState("");
  const [cashSales, setCashSales] = useState("");
  const [transferSales, setTransferSales] = useState("");
  const [voucherSales, setVoucherSales] = useState("");

  const [discountAmount, setDiscountAmount] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");
  const [cashDiffType, setCashDiffType] = useState("");
  const [cashDiffAmount, setCashDiffAmount] = useState("");

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [additionalMessage, setAdditionalMessage] = useState("");

  const [showCashDiffSheet, setShowCashDiffSheet] = useState(false);
  const [showReceiptSheet, setShowReceiptSheet] = useState(false);
  const [showMessageSheet, setShowMessageSheet] = useState(false);
  const [messageSheetText, setMessageSheetText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlreadyDoneDialog, setShowAlreadyDoneDialog] = useState(false);

  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const completedDate = localStorage.getItem("closingReportCompletedDate");
    if (completedDate === today) setShowAlreadyDoneDialog(true);
  }, []);

  // 당일 매장의 마감 보고 현황 체크

  // TODO: 추후 매장 토큰을 활용해 하드코딩 제거하기
  const storeId = 1;
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkClosingStatus(Number(storeId));

        if (data.is_completed) {
          setShowAlreadyDoneDialog(true);
        }
      } catch (err) {
        console.error("마감 상태 확인 실패:", err);
      }
    };

    fetchStatus();
  }, [storeId]);

  const handleNumberInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setter(cleaned);
  };

  const displayValue = (value: string) => {
    if (!value) return "";
    return Number(value).toLocaleString();
  };

  const handleNext = () => { if (step < 4) setStep(step + 1); };
  const handleSubmit = () => { setShowConfirmDialog(true); };

  // storeId는 props나 context에서 가져온다고 가정합니다.
  const handleConfirm = async () => {
    try {
      // 1. 데이터 가공 (문자열 -> 숫자)
      const payload = {
        store_id: Number(1), // 실제 storeId 변수 사용
        employee_id: Number(1),
        report_date: new Date().toISOString().slice(0, 10),

        card_sales: Number(cardSales) || 0,
        cash_sales: Number(cashSales) || 0,
        transfer_sales: Number(transferSales) || 0,
        gift_sales: Number(voucherSales) || 0, // voucherSales -> gift_sales 매칭

        discount_amount: Number(discountAmount) || 0,
        refund_amount: Number(refundAmount) || 0,
        cash_on_hand: Number(cashOnHand) || 0,

        // DB Enum 타입에 맞춰 한국어 -> 영어 변환
        cash_shortage_type: cashDiffType === "초과" ? "plus" : cashDiffType === "부족" ? "minus" : null,
        cash_shortage_amount: Number(cashDiffAmount) || 0,

        receipt_image_url: receiptImage, // 실제 구현 시 S3 업로드 후 URL을 보낼 것을 권장
        manager_note: additionalMessage,
      };

      // 2. API 호출
      await addClosingReport(payload);

      // 3. 성공 처리
      setShowConfirmDialog(false);
      toast("마감 보고가 완료 되었어요.", {
        duration: 3000,
        style: { background: "#3C3C3C", color: "#FFFFFF", border: "none", borderRadius: "8px" },
      });

      setTimeout(() => navigate(-1), 500);
    } catch (err) {
      toast.error("마감 보고 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  const handleMessageSheetSubmit = () => {
    setAdditionalMessage(messageSheetText);
    setShowMessageSheet(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
    setShowReceiptSheet(false);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const renderInput = (label: string, value: string, onChange: (v: string) => void, placeholder = "숫자만 입력") => (
    <div className="mb-6">
      <label className="block text-[14px] font-medium text-[#6B7280] mb-2">{label}</label>
      <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[12px] px-4 h-[52px]">
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue(value)}
          onChange={(e) => handleNumberInput(e.target.value, onChange)}
          className="flex-1 bg-transparent text-[16px] text-[#292B2E] placeholder:text-[#C5C7CA] outline-none"
        />
        <span className="text-[16px] text-[#6B7280] ml-2">원</span>
      </div>
    </div>
  );

  const sheetButtonStyle = (active = false) => ({
    width: '100%',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '16px',
    paddingRight: '16px',
    fontSize: '16px',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    color: '#19191B',
    transition: 'background-color 0.1s',
  } as React.CSSProperties);

  const sheetMouseHandlers = {
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = '#E8F3FF'; e.currentTarget.style.color = '#4261FF'; const icon = e.currentTarget.querySelector('.check-icon') as HTMLElement; if (icon) icon.style.display = 'block'; },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#19191B'; const icon = e.currentTarget.querySelector('.check-icon') as HTMLElement; if (icon) icon.style.display = 'none'; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#19191B'; const icon = e.currentTarget.querySelector('.check-icon') as HTMLElement; if (icon) icon.style.display = 'none'; },
    onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = '#E8F3FF'; e.currentTarget.style.color = '#4261FF'; const icon = e.currentTarget.querySelector('.check-icon') as HTMLElement; if (icon) icon.style.display = 'block'; },
    onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#19191B'; const icon = e.currentTarget.querySelector('.check-icon') as HTMLElement; if (icon) icon.style.display = 'none'; },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={handleBack} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>마감 보고</h1>
      </div>
      <div className="border-b border-border" />

      <div className="flex-1 px-5 pt-4 pb-[100px]">
        <h1 className="text-[24px] font-bold text-[#292B2E] leading-tight">{(() => { const now = new Date(); const days = ["일", "월", "화", "수", "목", "금", "토"]; return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} (${days[now.getDay()]})`; })()}</h1>
        <h2 className="text-[24px] font-bold text-[#292B2E] leading-tight mb-2">마감 보고하기</h2>

        {step === 1 && (
          <>
            <p className="text-[14px] text-[#8E8E93] mb-8">매출이 없는 항목은 입력하지 않아도 돼요</p>
            {renderInput("카드 매출 금액", cardSales, setCardSales)}
            {renderInput("현금 매출 금액", cashSales, setCashSales)}
            {renderInput("계좌이체 매출 금액", transferSales, setTransferSales)}
            {renderInput("상품권 매출 금액", voucherSales, setVoucherSales)}
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[14px] text-[#8E8E93] mb-8">매출이 없는 항목은 입력하지 않아도 돼요</p>
            {renderInput("할인 금액", discountAmount, setDiscountAmount)}
            {renderInput("환불금액", refundAmount, setRefundAmount)}
            {renderInput("현금 시재", cashOnHand, setCashOnHand)}
            <div className="mb-6" style={{ boxSizing: 'border-box', width: '100%' }}>
              <label className="block text-[14px] font-medium text-[#6B7280] mb-2">현금 과부족</label>
              <div className="flex gap-3" style={{ boxSizing: 'border-box', width: '100%' }}>
                <button
                  onClick={() => setShowCashDiffSheet(true)}
                  className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-[12px] h-[52px] flex-shrink-0"
                  style={{ width: '80px', padding: '0 10px', boxSizing: 'border-box' }}
                >
                  <span className={`text-[16px] whitespace-nowrap ${cashDiffType ? "text-[#292B2E]" : "text-[#C5C7CA]"}`}>{cashDiffType || "선택"}</span>
                  <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                </button>
                <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[12px] h-[52px] px-4" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="(금액)숫자만 입력"
                    value={displayValue(cashDiffAmount)}
                    onChange={(e) => handleNumberInput(e.target.value, setCashDiffAmount)}
                    className="flex-1 bg-transparent text-[16px] text-[#292B2E] placeholder:text-[#C5C7CA] outline-none min-w-0"
                  />
                  <span className="text-[16px] text-[#6B7280] ml-2">원</span>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-[14px] text-[#8E8E93] mb-8">
              매출액이 포함된 마감 영수증이 있다면<br />함께 업로드 해주세요
            </p>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowReceiptSheet(true)}
                className="w-[180px] h-[180px] rounded-[12px] overflow-hidden flex flex-col items-center justify-center"
                style={{ backgroundColor: '#D9D9D9' }}
              >
                {receiptImage ? (
                  <img src={receiptImage} alt="영수증" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-white mb-2" />
                    <p className="text-white text-[16px] font-semibold text-center leading-tight">마감 영수증<br />사진 업로드하기</p>
                  </>
                )}
              </button>
            </div>
            {receiptImage && (
              <div className="flex justify-center mt-3">
                <button onClick={() => setReceiptImage(null)} className="text-[13px] text-[#8E8E93] underline">사진 삭제</button>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-[14px] text-[#8E8E93] mb-8">사장님께 전달할 내용이 있다면 입력해 주세요</p>
            <label className="block text-[14px] font-medium text-[#6B7280] mb-2">추가 전달 내용(선택)</label>
            <button
              onClick={() => { setMessageSheetText(additionalMessage); setShowMessageSheet(true); }}
              className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-4 text-left min-h-[52px]"
            >
              <span className={`text-[16px] ${additionalMessage ? "text-[#292B2E]" : "text-[#C5C7CA]"}`}>{additionalMessage || "전달내용 입력"}</span>
            </button>
            <p className="text-right text-[13px] text-[#8E8E93] mt-1">{additionalMessage.length}/100</p>
          </>
        )}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white">
        {step < 4 ? (
          <button onClick={handleNext} className="w-full h-[56px] rounded-[14px] text-white text-[17px] font-semibold" style={{ backgroundColor: '#4261FF' }}>다음</button>
        ) : (
          <button onClick={handleSubmit} className="w-full h-[56px] rounded-[14px] text-white text-[17px] font-semibold" style={{ backgroundColor: '#4261FF' }}>보고 완료하기</button>
        )}
      </div>

      <input ref={albumInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      {/* 현금 과부족 유형 선택 */}
      <Drawer open={showCashDiffSheet} onOpenChange={setShowCashDiffSheet}>
        <DrawerContent className="[&>div:first-child]:hidden" style={{ width: '100%', height: '212px', borderRadius: '20px 20px 0 0', backgroundColor: '#FFFFFF', padding: '0' }}>
          <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px', paddingLeft: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>현금 과부족 유형 선택</h2>
              <DrawerClose asChild>
                <button style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </DrawerClose>
            </div>
            <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '16px' }}>
              {["부족", "초과"].map((type) => (
                <button
                  key={type}
                  onClick={() => { setCashDiffType(type); setShowCashDiffSheet(false); }}
                  {...sheetMouseHandlers}
                  style={sheetButtonStyle()}
                >
                  <span>{type}</span>
                  <Check className="check-icon" style={{ display: 'none', width: '16px', height: '16px', color: '#4261FF' }} />
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 마감 영수증 업로드 */}
      <Drawer open={showReceiptSheet} onOpenChange={setShowReceiptSheet}>
        <DrawerContent className="[&>div:first-child]:hidden" style={{ width: '100%', height: '212px', borderRadius: '20px 20px 0 0', backgroundColor: '#FFFFFF', padding: '0' }}>
          <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px', paddingLeft: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>마감 영수증 업로드</h2>
              <DrawerClose asChild>
                <button style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </DrawerClose>
            </div>
            <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '16px' }}>
              {[
                { label: '앨범에서 선택하기', ref: albumInputRef },
                { label: '카메라 촬영하기', ref: cameraInputRef },
              ].map(({ label, ref }) => (
                <button
                  key={label}
                  onClick={() => ref.current?.click()}
                  {...sheetMouseHandlers}
                  style={sheetButtonStyle()}
                >
                  <span>{label}</span>
                  <Check className="check-icon" style={{ display: 'none', width: '16px', height: '16px', color: '#4261FF' }} />
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 추가 전달 내용 입력 */}
      <Drawer open={showMessageSheet} onOpenChange={setShowMessageSheet}>
        <DrawerContent className="[&>div:first-child]:hidden" style={{ width: '100%', borderRadius: '20px 20px 0 0', backgroundColor: '#FFFFFF', padding: '0' }}>
          <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px', paddingLeft: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>추가 전달 내용 입력</h2>
              <DrawerClose asChild>
                <button style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </DrawerClose>
            </div>
            <div className="border border-[#E5E7EB] rounded-[12px] p-4 mb-2">
              <textarea
                placeholder="변경 사유를 입력해 주세요"
                value={messageSheetText}
                onChange={(e) => { if (e.target.value.length <= 50) setMessageSheetText(e.target.value); }}
                maxLength={50}
                className="w-full h-[160px] resize-none text-[16px] text-[#292B2E] placeholder:text-[#C5C7CA] outline-none bg-transparent"
              />
            </div>
            <p className="text-right text-[13px] text-[#8E8E93] mb-6">{messageSheetText.length}/50</p>
            <div className="flex gap-3" style={{ paddingBottom: '16px' }}>
              <button onClick={() => setShowMessageSheet(false)} className="flex-1 font-semibold text-sm" style={{ height: '56px', backgroundColor: '#DEEBFF', color: '#4261FF', borderRadius: '10px' }}>취소</button>
              <button onClick={handleMessageSheetSubmit} className="flex-1 font-semibold text-sm" style={{ height: '56px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '10px' }}>입력하기</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog} title="마감 보고하기"
        description={<>마감 보고를 진행하시겠어요?<br />작성한 내용은 사장님께 전달돼요.</>}
        buttons={[{ label: "취소", onClick: () => setShowConfirmDialog(false), variant: "cancel" }, { label: "확인", onClick: handleConfirm }]} />

      <ConfirmDialog open={showAlreadyDoneDialog} onOpenChange={() => { }} title="마감 보고 완료"
        description={<>오늘의 마감 보고는 완료 되었어요.<br />마감 보고는 하루에 한 번 가능해요.</>}
        buttons={[{ label: "확인", onClick: () => navigate("/employee/home") }]} />
    </div>
  );
};

export default ClosingReport;