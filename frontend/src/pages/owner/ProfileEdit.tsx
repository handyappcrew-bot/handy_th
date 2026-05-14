import { useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getOwnerInfo,
  getOwnerStores,
  updateOwnerNickname,
  updateOwnerProfileImage,
  deleteOwnerProfileImage,
  OwnerInfo,
  OwnerStore,
} from "@/api/ownerApi";
import { emitProfileImageChange } from "@/utils/profileImageEvents";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

function formatBirth(birth: string | null): string {
  if (!birth) return "-";
  const d = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return `${birth.replace(/-/g, '.')} (${age}세)`;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const memberId = Number(localStorage.getItem("currentMemberId") ?? 0);
  const currentStoreId = Number(localStorage.getItem("currentStoreId") ?? 0);
  const currentStoreMemberId = Number(localStorage.getItem("currentStoreMemberId") ?? 0);

  const [info, setInfo] = useState<OwnerInfo | null>(null);
  const [stores, setStores] = useState<OwnerStore[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!memberId || !currentStoreId) { setLoading(false); return; }
    const load = async () => {
      try {
        const [ownerInfo, ownerStores] = await Promise.all([
          getOwnerInfo(memberId, currentStoreId),
          getOwnerStores(memberId),
        ]);
        setInfo(ownerInfo);
        setStores(ownerStores);
        setName(ownerInfo.nickname ?? ownerInfo.name ?? "");
      } catch {
        toast({ description: "정보를 불러오지 못했습니다.", variant: "destructive", duration: 2000 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId, currentStoreId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ description: "매장코드가 복사되었어요", duration: 2000 });
  };

  const handleNameSave = async () => {
    if (!nameInput.trim()) return;
    try {
      await updateOwnerNickname(currentStoreId, currentStoreMemberId, nameInput.trim());
      setName(nameInput.trim());
      setNameSheetOpen(false);
      toast({ description: "이름이 변경되었어요", duration: 2000 });
    } catch {
      toast({ description: "이름 변경에 실패했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ description: "이미지 파일만 업로드 가능해요.", variant: "destructive", duration: 2000 });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ description: "5MB 이하 이미지만 업로드 가능해요.", variant: "destructive", duration: 2000 });
      return;
    }
    setPhotoSheetOpen(false);
    // 즉시 미리보기
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const { image_url } = await updateOwnerProfileImage(currentStoreId, currentStoreMemberId, file);
      setInfo((prev) => (prev ? { ...prev, image: image_url } : prev));
      // Profile(보기) 화면에 즉시 반영
      emitProfileImageChange({ imageUrl: image_url });
      toast({ description: "프로필 사진이 변경되었어요", duration: 2000 });
    } catch (err) {
      setPreviewImage(null);
      const msg = err instanceof Error ? err.message : "사진 업로드에 실패했습니다.";
      toast({ description: msg, variant: "destructive", duration: 2000 });
    }
  };

  const handleResetPhoto = async () => {
    setPhotoSheetOpen(false);
    try {
      await deleteOwnerProfileImage(currentStoreId, currentStoreMemberId);
      setInfo((prev) => (prev ? { ...prev, image: null } : prev));
      setPreviewImage(null);
      emitProfileImageChange({ imageUrl: null });
      toast({ description: "기본 프로필로 변경되었어요", duration: 2000 });
    } catch {
      toast({ description: "프로필 사진 삭제에 실패했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 닉네임이 변경된 경우에만 저장
      if (name !== info?.nickname) {
        await updateOwnerNickname(currentStoreId, currentStoreMemberId, name);
      }
      toast({ description: "내 정보가 수정되었어요.", duration: 2000 });
      navigate(-1);
    } catch {
      toast({ description: "수정에 실패했습니다.", variant: "destructive", duration: 2000 });
    } finally {
      setSaving(false);
    }
  };

  const primaryStore = stores[0];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #4261FF, #6b8cff)', animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes navDotBounce { 0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; } 40% { transform: scale(1.1) translateY(-4px); opacity: 1; } }`}</style>
    </div>
  );

  return (
    <div className="min-h-screen max-w-[430px] mx-auto bg-white font-[Pretendard] relative">
      <div className="pb-[100px]">
        {/* Header */}
        <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10 bg-white">
          <button onClick={() => navigate(-1)} className="pressable p-1">
            <ChevronLeft className="w-6 h-6 text-[#19191B]" />
          </button>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">내 정보 수정</h1>
        </div>
        <div className="border-b border-[#EEEEF0]" />

        {/* hidden file input — 프로필 사진 업로드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Profile Card */}
        <div className="flex items-center gap-4 py-6 px-5">
          <button
            type="button"
            onClick={() => setPhotoSheetOpen(true)}
            className="pressable relative flex-shrink-0"
          >
            <div className="w-[80px] h-[80px] rounded-full bg-[#F7F7F8] overflow-hidden border border-[#EEEEF0]">
              {previewImage ? (
                <img src={previewImage} alt="프로필" className="w-full h-full object-cover" />
              ) : info?.image ? (
                <img src={info.image.startsWith('/uploads') ? `${BASE_URL}${info.image}` : info.image} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-[#4261FF] flex items-center justify-center shadow-md">
              <span className="text-white text-[14px] font-bold leading-none">+</span>
            </div>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">{name || "-"}</span>
              <span className="text-[16px] font-medium text-[#70737B]">사장님</span>
            </div>
            {info && primaryStore && (
              <div className="mt-1">
                <span className="inline-flex items-center justify-center px-3 h-[28px] rounded-[4px] bg-[#4261FF]/10 text-[#4261FF] text-[14px] font-medium tracking-[-0.02em]">
                  {primaryStore.name} 가입 +{daysSince(info.joined_at)}일
                </span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* 인적 사항 */}
        <section className="py-5 px-5">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0">이름</span>
              <button
                onClick={() => { setNameInput(name); setNameSheetOpen(true); }}
                className="pressable flex-1 h-[44px] rounded-lg border border-border px-3 text-left text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]"
              >
                {name || "이름 없음"}
              </button>
            </div>
            <InfoRow label="생년월일" value={info ? formatBirth(info.birth) : "-"} />
            <InfoRow label="성별" value={info?.gender ?? "-"} />
            <InfoRow label="전화번호" value={info ? formatPhone(info.phone) : "-"} />
          </div>
        </section>

        <Divider />

        {/* 비밀번호 변경 */}
        <div className="px-5 py-1">
          <button
            onClick={() => navigate("/profile/edit/password")}
            className="pressable flex items-center justify-between w-full py-4"
          >
            <span className="text-[16px] font-medium tracking-[-0.02em] text-[#70737B]">비밀번호 변경</span>
            <span className="text-[#ADB1BA] text-[20px] font-light">›</span>
          </button>
        </div>

        <Divider />

        {/* 매장 정보 */}
        <section className="py-5 px-5">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B] mb-4">매장 정보</h2>
          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id} className="border border-[#EEEEF0] rounded-2xl p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-[#19191B]">{store.name}</h3>
                  <button
                    onClick={() => navigate(`/owner/store/delete?store=${store.id}`)}
                    className="pressable p-1.5 bg-[#F7F7F8] rounded-full text-[#70737B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <StoreInfoRow label="매장 코드" value={String(store.code)} isLink onCopy={() => handleCopyCode(String(store.code))} />
                  <StoreInfoRow label="업종" value={store.industry} />
                  <StoreInfoRow label="주소" value={store.address + (store.address_detail ? ` ${store.address_detail}` : '')} />
                  <StoreInfoRow label="대표자명" value={store.owner_name} />
                  <StoreInfoRow label="대표 번호" value={store.phone} />
                  <StoreInfoRow label="총 직원 수" value={`${store.employee_count}명`} />
                  <StoreInfoRow label="개업일" value={store.created_at.split('T')[0].replace(/-/g, '.')} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 회원탈퇴 버튼 */}
        <div className="px-5">
          <button
            onClick={() => navigate("/withdrawal")}
            className="pressable flex items-center justify-between w-full py-4"
          >
            <span className="text-[16px] font-medium tracking-[-0.02em] text-[#70737B]">회원탈퇴</span>
            <span className="text-[#ADB1BA] text-[20px] font-light">›</span>
          </button>
        </div>

        {/* 프로필 사진 변경 바텀시트 */}
        {photoSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setPhotoSheetOpen(false)}>
            <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#19191B]">프로필 사진 변경</h3>
                <button className="pressable p-1" onClick={() => setPhotoSheetOpen(false)}><X className="w-6 h-6 text-[#19191B]" /></button>
              </div>
              <div className="px-4 pb-10">
                <button onClick={() => fileInputRef.current?.click()} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">
                  앨범에서 선택하기
                </button>
                <button onClick={handleResetPhoto} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">
                  기본 프로필로 변경하기
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* 이름 입력 바텀시트 */}
        {nameSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setNameSheetOpen(false)}>
            <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#19191B]">이름 입력하기</h3>
                <button className="pressable p-1" onClick={() => setNameSheetOpen(false)}><X className="w-6 h-6 text-[#19191B]" /></button>
              </div>
              <div className="px-6 pb-10 space-y-4">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full h-[52px] px-4 border border-[#EEEEF0] rounded-xl bg-white focus:outline-none focus:border-[#4261FF] text-[16px]"
                />
                <div className="space-y-1">
                  <p className="text-[13px] text-[#4261FF] font-medium leading-relaxed">
                    * 닉네임을 사용할 경우 '닉네임(이름)' 형식으로 작성해주세요
                  </p>
                  <p className="text-[13px] text-[#19191B]">예) 핸디(홍길동)</p>
                </div>
                <button
                  onClick={handleNameSave}
                  disabled={!nameInput.trim()}
                  className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold disabled:bg-[#DBDCDF] disabled:text-white"
                >
                  입력 완료
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 pt-3 pb-8 bg-white border-t border-[#EEEEF0]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold disabled:bg-[#DBDCDF] disabled:text-white"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="text-[16px] font-medium tracking-[-0.02em] text-[#70737B] w-[100px] flex-shrink-0">{label}</span>
      <span className="text-[16px] font-medium tracking-[-0.02em] text-[#19191B] flex-1 min-w-0">{value}</span>
    </div>
  );
}

function StoreInfoRow({ label, value, isLink, onCopy }: { label: string; value: string; isLink?: boolean; onCopy?: () => void }) {
  return (
    <div className={`flex gap-4 ${isLink ? 'pressable cursor-pointer' : ''}`} onClick={isLink ? onCopy : undefined}>
      <span className="text-[14px] text-[#70737B] min-w-[72px] flex-shrink-0">{label}</span>
      <span className={`text-[14px] ${isLink ? 'text-[#4261FF] font-semibold underline' : 'text-[#19191B]'}`}>{value}</span>
    </div>
  );
}
