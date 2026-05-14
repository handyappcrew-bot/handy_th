import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronDown, ChevronRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface ProfileData {
  name: string;
  birth: string | null;
  age: number | null;
  gender: string | null;
  phone: string;
  image_url: string | null;
  bank: string | null;
  account_number: string | null;
  store_name: string;
  joined_at: string;
  days_since_joined: number;
  role: string;
  employee_type: string | null;
  salary_cycle: string | null;
  salary_day: number | null;
  hourly_rate: number | null;
  is_probation: boolean;
  income_tax: number | null;
  local_income_tax: number | null;
  national_pension_tax: number | null;
  health_insurance_tax: number | null;
  long_term_care_tax: number | null;
  employment_insurance_tax: number | null;
  industrial_accident_tax: number | null;
  resume: string | null;
  employment_contract: string | null;
  health_certificate: string | null;
}
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { changeInfo, deleteEmployeeProfileImage } from "@/api/mypage";
import { emitProfileImageChange } from "@/utils/profileImageEvents";

const allBanks = [
  "국민은행", "신한은행", "농협", "우리은행", "기업은행", "하나은행",
  "토스뱅크", "카카오뱅크", "새마을금고", "케이뱅크", "우체국", "SC제일은행",
  "IM뱅크", "부산은행", "광주은행", "경남은행", "신협", "산업은행",
  "수협은행", "한국씨티은행", "SBI저축은행", "제주은행", "전북은행", "산림조합중앙회",
];

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useLocation();
  const profileData: ProfileData = state?.profileData;
  const storeId: number = state?.storeId ?? Number(localStorage.getItem("currentStoreId") ?? 1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profileData?.name ?? "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [resetImage, setResetImage] = useState(false);
  const birthDate = profileData?.birth ?? "";
  const age = profileData?.age ?? null;
  const gender = profileData?.gender ?? "";
  const phone = profileData?.phone ?? "";
  const [bank, setBank] = useState(profileData?.bank ?? "");
  const [accountNumber, setAccountNumber] = useState(profileData?.account_number ?? "");

  const [originalImageUrl] = useState<string | null>(profileData?.image_url ?? null);

  const previewSrc = resetImage ? null : (profileImage ?? (profileData?.image_url ? `${BASE_URL}${profileData.image_url}` : null));

  const contract = {
    employmentType: profileData?.employee_type ?? "",
    joinDate: profileData?.joined_at ?? "",
    joinDays: profileData?.days_since_joined ?? 0,
    probation: profileData?.is_probation ? "수습 적용" : "수습 미적용",
    salaryType: profileData?.salary_cycle ?? "",
    salaryDay: profileData?.salary_day != null ? `${profileData.salary_day}일` : "",
    hourlyWage: profileData?.hourly_rate != null ? `${profileData.hourly_rate.toLocaleString()}원` : "",
  };

  const formatRate = (value: number | null, suffix = "%") =>
    value != null ? `(${value}${suffix})` : "";

  const tax = {
    incomeTax: [
      { label: "소득세", rate: formatRate(profileData?.income_tax) },
      { label: "지방소득세", rate: formatRate(profileData?.local_income_tax) },
    ],
    insurance: [
      { label: "국민연금", rate: formatRate(profileData?.national_pension_tax) },
      { label: "건강보험", rate: formatRate(profileData?.health_insurance_tax) },
      { label: "장기요양보험", rate: formatRate(profileData?.long_term_care_tax) },
      { label: "고용보험", rate: formatRate(profileData?.employment_insurance_tax) },
      { label: "산재보험", rate: formatRate(profileData?.industrial_accident_tax) },
    ],
  };

  const [documentItems, setDocumentItems] = useState([
    { label: "이력서", key: "resume", fileName: profileData?.resume ?? null, uploaded: profileData?.resume != null, file: null as File | null },
    { label: "근로계약서", key: "employment_contract", fileName: profileData?.employment_contract ?? null, uploaded: profileData?.employment_contract != null, file: null as File | null },
    { label: "보건증", key: "health_certificate", fileName: profileData?.health_certificate ?? null, uploaded: profileData?.health_certificate != null, file: null as File | null },
  ]);

  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [accountInput, setAccountInput] = useState(accountNumber);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [docUploadSheetOpen, setDocUploadSheetOpen] = useState(false);
  const [docUploadIndex, setDocUploadIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  const isFormValid = name.trim() !== "" && bank.trim() !== "" && accountNumber.trim() !== "";

  const handleNameSubmit = () => {
    if (nameInput.trim()) { setName(nameInput.trim()); setNameSheetOpen(false); }
  };

  const handleAccountSubmit = () => {
    if (accountInput.trim()) { setAccountNumber(accountInput.trim()); setAccountSheetOpen(false); }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setProfileImage(ev.target?.result as string); setResetImage(false); setPhotoSheetOpen(false); };
      reader.readAsDataURL(file);
    }
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && docUploadIndex !== null) {
      setDocumentItems(prev => prev.map((item, i) =>
        i === docUploadIndex ? { ...item, fileName: file.name, uploaded: true, file } : item
      ));
      setDocUploadSheetOpen(false);
      setDocUploadIndex(null);
    }
  };

  const handleEditConfirm = async () => {
    try {
      if (resetImage) await deleteEmployeeProfileImage(storeId);
      const result = await changeInfo(
        name,
        bank,
        accountNumber,
        resetImage ? null : profileImage,
        resetImage ? null : (profileData?.image_url ?? null),
        {
          resume: documentItems.find(d => d.key === "resume")?.file ?? null,
          employment_contract: documentItems.find(d => d.key === "employment_contract")?.file ?? null,
          health_certificate: documentItems.find(d => d.key === "health_certificate")?.file ?? null,
        },
        storeId,
      );
      setEditConfirmOpen(false);
      if (resetImage) {
        emitProfileImageChange({ imageUrl: null });
      } else if (result?.image_url) {
        emitProfileImageChange({ imageUrl: result.image_url });
      } else if (profileImage && profileImage.startsWith("data:")) {
        emitProfileImageChange({ previewUrl: profileImage });
      }
      toast({ description: "내 정보가 수정되었어요.", duration: 2000 });
      navigate("/employee/profile");
    } catch (err: any) {
      setEditConfirmOpen(false);
      toast({ description: err?.message ?? "저장 중 오류가 발생했어요.", variant: "destructive", duration: 2000 });
    }
  };

  const handleDeleteDocument = () => {
    if (deleteTargetIndex === null) return;
    setDocumentItems(prev => prev.map((item, i) =>
      i === deleteTargetIndex ? { ...item, fileName: null, uploaded: false, file: null } : item
    ));
    setDeleteDialogOpen(false);
    setDeleteTargetIndex(null);
  };

  const getDocUploadTitle = () => {
    if (docUploadIndex === null) return "";
    return `${documentItems[docUploadIndex]?.label} 업로드하기`;
  };

  const allSubmitted = documentItems.every(d => d.uploaded);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative font-[Pretendard]" style={{ backgroundColor: '#FFFFFF' }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
      <input ref={docFileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocFileSelect} />

      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="pressable p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>내 정보 수정</h1>
      </div>
      <div className="border-b border-border" />

      <div className="pb-[100px]">
        {/* Profile Card */}
        <div className="flex items-center gap-4 py-4 px-[20px]">
          <button onClick={() => setPhotoSheetOpen(true)} className="pressable relative flex-shrink-0">
            <div className="w-[80px] h-[80px] rounded-full bg-[#F7F7F8] overflow-hidden border border-[#EEEEF0]">
              {previewSrc ? (
                <img src={previewSrc} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-primary flex items-center justify-center shadow-md">
              <span className="text-white text-[14px] font-bold leading-none">+</span>
            </div>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(240,7%,10%)]">{name}</span>
              <span className="text-[16px] tracking-[-0.02em] font-normal text-[hsl(223,5%,46%)]">{contract.employmentType}</span>
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center justify-center w-[199px] h-[28px] rounded-[4px] bg-primary/10 text-primary text-[14px] tracking-[-0.02em] font-medium">
                {profileData?.store_name} 입사 +{contract.joinDays}일
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-[12px] bg-[#F7F7F8]" />

        {/* 인적 사항 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0">이름</span>
              <button onClick={() => { setNameInput(name); setNameSheetOpen(true); }} className="pressable flex-1 h-[44px] rounded-lg border border-border px-3 text-left text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">{name}</button>
            </div>
            <InfoRow label="생년월일" value={birthDate ? `${birthDate}${age != null ? ` (${age}세)` : ""}` : "-"} />
            <InfoRow label="성별" value={gender || "-"} />
            <InfoRow label="전화번호" value={phone} />
            <div className="flex items-center">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0">은행</span>
              <button onClick={() => setBankSheetOpen(true)} className={`pressable flex-1 h-[44px] rounded-lg border px-3 flex items-center justify-between text-[16px] tracking-[-0.02em] font-medium ${!bank ? "border-destructive text-destructive" : "border-border text-[hsl(210,5%,16%)]"}`}>
                <span>{bank || "미선택"}</span>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0">계좌번호</span>
              <button onClick={() => { setAccountInput(accountNumber); setAccountSheetOpen(true); }} className={`pressable flex-1 h-[44px] rounded-lg border px-3 text-left text-[16px] tracking-[-0.02em] font-medium ${!accountNumber ? "border-destructive text-destructive" : "border-border text-[hsl(210,5%,16%)]"}`}>
                {accountNumber || "미입력"}
              </button>
            </div>
            <button onClick={() => navigate("/profile/edit/password")} className="pressable flex items-center justify-between w-full pt-1">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)]">비밀번호 변경</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        <div className="w-full h-[12px] bg-[hsl(0,0%,97%)]" />

        {/* 계약 정보 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">계약 정보</h2>
          <div className="space-y-3">
            <InfoRow label="고용형태" value={contract.employmentType || "-"} />
            <InfoRow label="입사일" value={contract.joinDate ? `${contract.joinDate} (+${contract.joinDays}일)` : "-"} />
            <InfoRow label="수습" value={contract.probation} />
            <InfoRow label="급여주기" value={contract.salaryType || "-"} />
            <InfoRow label="시급" value={contract.hourlyWage || "-"} />
            <InfoRow label="급여일" value={contract.salaryDay || "-"} />
          </div>
        </section>

        <div className="w-full h-[12px] bg-[hsl(0,0%,97%)]" />

        {/* 세금 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">세금</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">소득세</span>
              <div className="flex-1 space-y-1">
                {tax.incomeTax.map((item, i) => (
                  <p key={i} className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">
                    {item.label} <span className="font-normal text-[hsl(223,5%,46%)]">{item.rate}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">4대 보험</span>
              <div className="flex-1 space-y-1">
                {tax.insurance.map((item, i) => (
                  <p key={i} className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">
                    {item.label} <span className="font-normal text-[hsl(223,5%,46%)]">{item.rate}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="w-full h-[12px] bg-[hsl(0,0%,97%)]" />

        {/* 계약서 */}
        <section className="py-5 px-[20px]">
          <div className="flex items-center mb-4">
            <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] w-[100px] flex-shrink-0">계약서</h2>
            <span className={`inline-flex items-center gap-1.5 text-[14px] tracking-[-0.02em] font-medium ${allSubmitted ? "text-[hsl(145,63%,42%)]" : "text-destructive"}`}>
              {allSubmitted ? "✓" : "⚠"} {allSubmitted ? "필수 계약서 제출 완료" : "필수 계약서 제출 미완료"}
            </span>
          </div>
          <div className="space-y-3">
            {documentItems.map((doc, idx) => (
              <div key={doc.label} className="flex items-center">
                <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0">{doc.label}</span>
                {doc.uploaded && doc.fileName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[16px] tracking-[-0.02em] text-primary font-medium">
                      {doc.file ? doc.file.name : `${doc.label} 보기`}
                    </span>
                    <button onClick={() => { setDeleteTargetIndex(idx); setDeleteDialogOpen(true); }} className="pressable text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setDocUploadIndex(idx); setDocUploadSheetOpen(true); }} className="pressable flex-1 h-[44px] rounded-lg border border-border flex items-center justify-center text-[14px] text-[hsl(210,5%,16%)] font-medium">
                    {doc.label} 업로드하기
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="w-full h-[12px] bg-[hsl(0,0%,97%)]" />

        <div className="px-[20px]">
          <button onClick={() => navigate("/withdrawal")} className="pressable flex items-center justify-between w-full py-4">
            <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)]">회원탈퇴</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-[20px] pb-8" style={{ backgroundColor: '#FFFFFF' }}>
          <button onClick={() => { if (isFormValid) setEditConfirmOpen(true); }} disabled={!isFormValid} className={`w-full py-4 rounded-xl text-[16px] font-semibold ${isFormValid ? "bg-primary text-primary-foreground" : "btn-disabled"}`}>
            수정하기
          </button>
        </div>,
        document.body
      )}

      {/* 이름 입력 바텀시트 */}
      {nameSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setNameSheetOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '30px 20px 20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>이름 입력하기</h2>
                <button className="pressable p-1" onClick={() => setNameSheetOpen(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="이름 입력" className="w-full h-[52px] rounded-xl border border-border px-4 text-[16px] focus:outline-none focus:border-primary" style={{ color: '#19191B' }} />
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: '#4261FF' }}>닉네임을 사용할 경우 '닉네임(이름)' 형식으로 작성해주세요</p>
              <p className="text-[13px]" style={{ color: '#19191B' }}>예) 핸디(홍길동)</p>
              <button onClick={handleNameSubmit} disabled={!nameInput.trim()} className="mt-6 w-full py-4 rounded-xl text-[16px] font-semibold" style={{ backgroundColor: nameInput.trim() ? '#4261FF' : '#DBDCDF', color: nameInput.trim() ? '#FFFFFF' : '#FFFFFF' }}>입력 완료</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {photoSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setPhotoSheetOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>프로필 사진 변경</h2>
                <button className="pressable p-1" onClick={() => setPhotoSheetOpen(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '20px' }}>
                {[
                  { label: '앨범에서 선택하기', onClick: () => fileInputRef.current?.click() },
                  { label: '기본 프로필로 변경하기', onClick: () => { setResetImage(true); setProfileImage(null); setPhotoSheetOpen(false); } },
                ].map(({ label, onClick }) => (
                  <button key={label} onClick={onClick} className="pressable"
                    style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '4px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 계좌번호 입력 바텀시트 */}
      {accountSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setAccountSheetOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '30px 20px 20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>계좌번호 입력하기</h2>
                <button className="pressable p-1" onClick={() => setAccountSheetOpen(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <input type="text" inputMode="numeric" value={accountInput} onChange={(e) => setAccountInput(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="숫자와 '-' 포함 입력" className="w-full h-[52px] rounded-xl border border-border px-4 text-[16px] focus:outline-none focus:border-primary" style={{ color: '#19191B' }} />
              <button onClick={handleAccountSubmit} disabled={!accountInput.trim()} className="mt-6 w-full py-4 rounded-xl text-[16px] font-semibold" style={{ backgroundColor: accountInput.trim() ? '#4261FF' : '#DBDCDF', color: accountInput.trim() ? '#FFFFFF' : '#FFFFFF' }}>입력 완료</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 은행 선택 바텀시트 */}
      {bankSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setBankSheetOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom overflow-y-auto" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '30px 20px 20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>은행을 선택해주세요</h2>
                <button className="pressable p-1" onClick={() => setBankSheetOpen(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {allBanks.map((b) => (
                  <button key={b} onClick={() => { setBank(b); setBankSheetOpen(false); }}
                    className="pressable"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', backgroundColor: bank === b ? '#E8F3FF' : '#F7F7F8', color: bank === b ? '#4261FF' : '#19191B', border: bank === b ? '1px solid #4261FF' : '1px solid transparent' }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 계약서 업로드 바텀시트 */}
      {docUploadSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setDocUploadSheetOpen(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{getDocUploadTitle()}</h2>
                <button className="pressable p-1" onClick={() => setDocUploadSheetOpen(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '20px' }}>
                {[
                  { label: '앨범에서 선택하기', onClick: () => docFileInputRef.current?.click() },
                  { label: '카메라 촬영하기', onClick: () => docFileInputRef.current?.click() },
                ].map(({ label, onClick }) => (
                  <button key={label} onClick={onClick} className="pressable"
                    style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '4px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="계약서 삭제"
        description={<>계약서를 삭제하시겠어요?<br />해당 계약서는 필수 계약서로<br />삭제 시 사장님이 열람할 수 없어요</>}
        buttons={[{ label: "취소", onClick: () => setDeleteDialogOpen(false), variant: "cancel" }, { label: "삭제하기", onClick: handleDeleteDocument }]} />

      <ConfirmDialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen} title="회원정보 수정"
        description="회원정보를 수정하시겠어요?"
        buttons={[{ label: "취소", onClick: () => setEditConfirmOpen(false), variant: "cancel" }, { label: "수정하기", onClick: handleEditConfirm }]} />
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start">
    <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)] flex-1 min-w-0">{value}</span>
  </div>
);

export default ProfileEdit;