import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/hooks/use-toast";
import { updateStoreInfo } from "@/api/owner/store";

const BUSINESS_TYPES = ["음식점 / 카페", "편의점", "판매 / 매장", "서비스업", "교육", "기타"];

interface FieldDrawerProps {
  open: boolean; onOpenChange: (open: boolean) => void; title: string;
  placeholder: string;
  value: string; onConfirm: (val: string) => void;
  inputType?: string;
  required?: boolean;
}

function FieldDrawer({ open, onOpenChange, title, placeholder, value, onConfirm, inputType = "text", required = true }: FieldDrawerProps) {
  const [localVal, setLocalVal] = useState(value);
  const isValid = required ? localVal.trim() : true;

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        <div style={{ padding: "0 20px 20px" }} className="space-y-4">
          <input type={inputType}
            className="w-full border border-border rounded-xl px-4 py-3 text-[14px] text-foreground bg-background outline-none focus:border-primary"
            placeholder={placeholder} value={localVal} onChange={e => setLocalVal(e.target.value)} />
          <button
            disabled={!isValid}
            onClick={() => { onConfirm(localVal); onOpenChange(false); }}
            style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: isValid ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: isValid ? "pointer" : "default" }}>
            입력 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BusinessTypeDrawer({ open, onOpenChange, onSelect, currentValue }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSelect: (val: string) => void; currentValue: string;
}) {
  const [selected, setSelected] = useState(currentValue);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>업종 선택하기</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        <div style={{ padding: "0 20px 20px" }} className="space-y-1">
          {BUSINESS_TYPES.map(type => {
            const isSelected = type === selected;
            return (
              <button key={type}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] flex items-center justify-between ${isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                onClick={() => setSelected(type)}>
                <span>{type}</span>
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
          <button onClick={() => { onSelect(selected); onOpenChange(false); }}
            style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: "#4261FF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: "pointer", marginTop: "12px" }}>
            입력완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function StoreInfoEdit() {
  const navigate = useNavigate();
  const location = useLocation();

  const storeInfo = location.state?.storeInfo;

  const [storeName, setStoreName] = useState(storeInfo?.name);
  const [address, setAddress] = useState(storeInfo?.address);
  const [addressDetail, setAddressDetail] = useState(storeInfo?.addressDetail ?? "");
  const [businessType, setBusinessType] = useState(storeInfo?.industry);
  const [ownerName, setOwnerName] = useState(storeInfo?.owner);
  const [phone, setPhone] = useState(storeInfo?.number);
  const [drawerType, setDrawerType] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);


  const handleSave = async () => {
    try {
      await updateStoreInfo({
        id: storeInfo.id,
        name: storeName,
        address: address,
        addressDetail: addressDetail,
        industry: businessType,
        owner: ownerName,
        number: phone
      });

      setConfirmOpen(false);
      toast({ description: "매장 정보가 수정되었어요", duration: 2000 });

      navigate(-1);

    } catch (error) {
      console.error("저장 실패:", error);
      toast({ description: "수정 중 오류가 발생했습니다.", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ minHeight: '100dvh' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>매장 정보 수정</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        <div className="p-5">
          {/* 매장명 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>매장명 <span style={{ color: '#FF3D3D' }}>*</span></label>
            <button onClick={() => setDrawerType("storeName")}
              onMouseDown={() => setFocusedField("storeName")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
              onTouchStart={() => setFocusedField("storeName")} onTouchEnd={() => setFocusedField(null)}
              className="w-full text-left bg-background flex items-center"
              style={{ height: '52px', padding: '0 20px', border: focusedField === "storeName" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', transition: 'border 0.15s' }}>
              {storeName}
            </button>
          </div>

          {/* 주소 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>주소 <span style={{ color: '#FF3D3D' }}>*</span></label>
            <div className="flex items-center"
              onClick={openPostcode}
              style={{ height: '52px', padding: '0 20px', border: '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', backgroundColor: '#F7F7F8' }}>
              {address}
            </div>
          </div>

          {/* 상세 주소 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>상세 주소</label>
            <button onClick={() => setDrawerType("addressDetail")}
              onMouseDown={() => setFocusedField("addressDetail")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
              onTouchStart={() => setFocusedField("addressDetail")} onTouchEnd={() => setFocusedField(null)}
              className="w-full text-left bg-background flex items-center"
              style={{ height: '52px', padding: '0 20px', border: focusedField === "addressDetail" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', transition: 'border 0.15s' }}>
              {addressDetail}
            </button>
          </div>

          {/* 업종 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>업종 <span style={{ color: '#FF3D3D' }}>*</span></label>
            <button onClick={() => setDrawerType("businessType")}
              onMouseDown={() => setFocusedField("businessType")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
              onTouchStart={() => setFocusedField("businessType")} onTouchEnd={() => setFocusedField(null)}
              className="w-full bg-background flex items-center justify-between"
              style={{ height: '52px', padding: '0 20px', border: focusedField === "businessType" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', transition: 'border 0.15s' }}>
              <span>{businessType}</span>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* 대표자명 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>대표자명 <span style={{ color: '#FF3D3D' }}>*</span></label>
            <button onClick={() => setDrawerType("ownerName")}
              onMouseDown={() => setFocusedField("ownerName")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
              onTouchStart={() => setFocusedField("ownerName")} onTouchEnd={() => setFocusedField(null)}
              className="w-full text-left bg-background flex items-center"
              style={{ height: '52px', padding: '0 20px', border: focusedField === "ownerName" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', transition: 'border 0.15s' }}>
              {ownerName}
            </button>
          </div>

          {/* 대표번호 */}
          <div style={{ marginBottom: '30px' }}>
            <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '16px' }}>대표번호 <span style={{ color: '#FF3D3D' }}>*</span></label>
            <button onClick={() => setDrawerType("phone")}
              onMouseDown={() => setFocusedField("phone")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)}
              onTouchStart={() => setFocusedField("phone")} onTouchEnd={() => setFocusedField(null)}
              className="w-full text-left bg-background flex items-center"
              style={{ height: '52px', padding: '0 20px', border: focusedField === "phone" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', fontSize: '15px', color: '#19191B', transition: 'border 0.15s' }}>
              {phone}
            </button>
          </div>
        </div>

        {/* 저장하기 버튼 */}
        {createPortal(
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
            <div style={{ maxWidth: "512px", margin: "0 auto", padding: "16px 20px" }}>
              <button onClick={() => setConfirmOpen(true)}
                style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: "#4261FF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: "pointer" }}>
                매장 정보 수정하기
              </button>
            </div>
          </div>,
          document.body
        )}

        <FieldDrawer open={drawerType === "storeName"} onOpenChange={o => !o && setDrawerType(null)} title="매장명 입력하기" placeholder="매장명 입력" value={storeName} onConfirm={setStoreName} />
        <FieldDrawer open={drawerType === "addressDetail"} onOpenChange={o => !o && setDrawerType(null)} title="상세 주소 입력하기" placeholder="상세 주소 입력" value={addressDetail} onConfirm={setAddressDetail} required={false} />
        <FieldDrawer open={drawerType === "ownerName"} onOpenChange={o => !o && setDrawerType(null)} title="대표자명 입력하기" placeholder="대표자명 입력" value={ownerName} onConfirm={setOwnerName} />
        <FieldDrawer open={drawerType === "phone"} onOpenChange={o => !o && setDrawerType(null)} title="대표번호 입력하기" placeholder="'-' 포함 입력" value={phone} onConfirm={setPhone} inputType="tel" />
        {confirmOpen && createPortal(
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={() => setConfirmOpen(false)}>
            <div style={{ width: "calc(100% - 48px)", maxWidth: "320px", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "8px" }}>매장 정보 수정</h3>
              <p style={{ fontSize: "14px", color: "#70737B", textAlign: "center", lineHeight: "1.6", marginBottom: "20px" }}>입력한 내용으로 매장 정보를 수정하시겠어요?</p>
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button onClick={() => setConfirmOpen(false)} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>취소</button>
                <button onClick={handleSave} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" }}>수정하기</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        <BusinessTypeDrawer open={drawerType === "businessType"} onOpenChange={o => !o && setDrawerType(null)} onSelect={setBusinessType} currentValue={businessType} />
      </div>
    </div>
  );
}
