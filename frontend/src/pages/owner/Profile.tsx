import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdBanner from "@/components/AdBanner";
import { logout, getMyStores } from "@/api/public";
import { getOwnerInfo, getOwnerStores, OwnerInfo, OwnerStore } from "@/api/ownerApi";
import { onProfileImageChange } from "@/utils/profileImageEvents";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

function formatBirth(birth: string | null): string {
  if (!birth) return "-";
  const d = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  const ymd = birth.replace(/-/g, '.');
  return `${ymd} (${age}세)`;
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

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const memberId = Number(localStorage.getItem("currentMemberId") ?? 0);
  const currentStoreId = Number(localStorage.getItem("currentStoreId") ?? 0);

  const [info, setInfo] = useState<OwnerInfo | null>(null);
  const [stores, setStores] = useState<OwnerStore[]>([]);
  const [storeOrder, setStoreOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  // store.id → store_member_id 매핑 (매장 전환 시 currentStoreMemberId 갱신용)
  const [memberIdByStoreId, setMemberIdByStoreId] = useState<Record<number, number>>({});

  const [editDialog, setEditDialog] = useState<number | null>(null);
  const [switchDialog, setSwitchDialog] = useState<number | null>(null);
  const [logoutDialog, setLogoutDialog] = useState(false);

  useEffect(() => {
    if (!memberId || !currentStoreId) { setLoading(false); return; }
    const load = async () => {
      try {
        const [ownerInfo, ownerStores, myStores] = await Promise.all([
          getOwnerInfo(memberId, currentStoreId),
          getOwnerStores(memberId),
          getMyStores(),
        ]);
        setInfo(ownerInfo);
        setStores(ownerStores);

        // store.id → store_member_id 매핑 (owner 역할만)
        const map: Record<number, number> = {};
        (myStores as any[]).forEach((s) => {
          if (s.role === "owner") map[s.store_id] = s.store_member_id;
        });
        setMemberIdByStoreId(map);

        // 현재 선택된 매장을 첫 자리에 배치
        const currentIdx = ownerStores.findIndex(s => s.id === currentStoreId);
        const base = ownerStores.map((_, i) => i);
        if (currentIdx > 0) {
          setStoreOrder([currentIdx, ...base.filter(i => i !== currentIdx)]);
        } else {
          setStoreOrder(base);
        }
      } catch {
        toast({ description: "정보를 불러오지 못했습니다.", variant: "destructive", duration: 2000 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId, currentStoreId, location.key]);

  // ProfileEdit에서 사진 변경 시 즉시 반영
  useEffect(() => {
    return onProfileImageChange(({ imageUrl }) => {
      setInfo((prev) => (prev ? { ...prev, image: imageUrl ?? null } : prev));
    });
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ description: "매장코드가 복사되었어요", duration: 2000 });
  };

  const handleEditConfirm = () => {
    setEditDialog(null);
    navigate("/owner/store");
  };

  const handleSwitchConfirm = (storeIdx: number) => {
    setSwitchDialog(null);
    setStoreOrder((prev) => {
      const newOrder = prev.filter((i) => i !== storeIdx);
      return [storeIdx, ...newOrder];
    });
    // 전환된 매장을 localStorage에 저장 (storeId + storeMemberId 한쌍으로)
    const newStore = stores[storeIdx];
    if (newStore) {
      localStorage.setItem("currentStoreId", String(newStore.id));
      const newStoreMemberId = memberIdByStoreId[newStore.id];
      if (newStoreMemberId != null) {
        localStorage.setItem("currentStoreMemberId", String(newStoreMemberId));
      }
      localStorage.setItem("currentRole", "owner");
    }
    toast({ description: "매장이 전환되었어요", duration: 2000 });
  };

  const handleLogout = async () => {
    setLogoutDialog(false);
    try {
      await logout();
    } catch { /* 실패해도 로컬 정리 후 이동 */ }
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentStoreId");
    localStorage.removeItem("currentStoreMemberId");
    localStorage.removeItem("currentMemberId");
    toast({ description: "로그아웃 되었어요", duration: 2000 });
    navigate("/");
  };

  const displayName = info?.nickname ?? info?.name ?? "-";
  const primaryStore = stores[storeOrder[0]];

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
    <div className="min-h-screen max-w-[430px] mx-auto relative font-[Pretendard]" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <button onClick={() => navigate('/owner/home')} className="pressable p-1">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>내 정보</h1>
        </div>
        <div className="border-b border-border" />

        {/* Profile Card */}
        <div className="flex items-center gap-4 py-4 px-[20px]">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0 bg-[hsl(240,4.8%,95.9%)]">
            {info?.image ? (
              <img src={info.image.startsWith('/uploads') ? `${BASE_URL}${info.image}` : info.image} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(240,7%,10%)]">{displayName}</span>
              <span className="text-[16px] tracking-[-0.02em] font-normal text-[hsl(223,5%,46%)]">사장님</span>
            </div>
            {info && primaryStore && (
              <div className="mt-1 flex">
                <span className="inline-flex items-center justify-center h-[28px] px-[10px] rounded-[4px] bg-primary/10 text-primary text-[14px] tracking-[-0.02em] font-medium whitespace-nowrap w-auto">
                  {primaryStore.name} 가입 +{daysSince(info.joined_at)}일
                </span>
              </div>
            )}
          </div>
          <button className="pressable p-2 self-start mt-1" onClick={() => navigate("/owner/profile/edit")}>
            <Pencil className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <Divider />

        {/* 인적 사항 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <InfoRow label="생년월일" value={info ? formatBirth(info.birth) : "-"} />
            <InfoRow label="성별" value={info?.gender ?? "-"} />
            <InfoRow label="전화번호" value={info ? formatPhone(info.phone) : "-"} />
          </div>
        </section>

        <Divider />

        {/* 광고 배너 */}
        <div className="py-4">
          <AdBanner />
        </div>

        <Divider />

        {/* 매장 정보 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">매장 정보</h2>
          <div className="space-y-4">
            {storeOrder.map((storeIdx, orderPos) => {
              const store = stores[storeIdx];
              if (!store) return null;
              const isFirst = orderPos === 0;
              return (
                <div key={store.id} className="border border-border rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-[#19191B]">{store.name}</h3>
                    {isFirst ? (
                      <button onClick={() => setEditDialog(storeIdx)}
                        className="pressable text-[12px] text-primary border border-primary rounded-full px-3 py-1 font-medium">
                        수정하기
                      </button>
                    ) : (
                      <button onClick={() => setSwitchDialog(storeIdx)}
                        className="pressable text-[12px] text-muted-foreground border border-border rounded-full px-3 py-1 font-medium">
                        매장 전환 ↔
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <StoreInfoRow label="매장 코드" value={String(store.code)} isLink onCopy={() => handleCopyCode(String(store.code))} />
                    <StoreInfoRow label="업종" value={store.industry} />
                    <StoreInfoRow label="주소" value={store.address + (store.address_detail ? ` ${store.address_detail}` : '')} />
                    <StoreInfoRow label="대표자명" value={store.owner_name} />
                    <StoreInfoRow label="대표 번호" value={store.phone} />
                    <StoreInfoRow label="총 직원 수" value={`${store.employee_count}명`} />
                    <StoreInfoRow label="개업일" value={store.created_at.split('T')[0].replace(/-/g, '.')} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Divider />

        {/* Footer Buttons */}
        <div className="py-8 flex justify-center px-5">
          <button onClick={() => setLogoutDialog(true)}
            className="pressable text-sm text-muted-foreground underline underline-offset-2">
            로그아웃
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={editDialog !== null}
        onOpenChange={(open) => !open && setEditDialog(null)}
        title="매장 정보 수정하기"
        description={editDialog !== null && stores[editDialog] ? `${stores[editDialog].name}\n매장 정보를 수정하시겠어요?` : ""}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setEditDialog(null) },
          { label: "수정하기", variant: "confirm", onClick: handleEditConfirm },
        ]}
      />
      <ConfirmDialog
        open={switchDialog !== null}
        onOpenChange={(open) => !open && setSwitchDialog(null)}
        title="매장 전환하기"
        description={switchDialog !== null && stores[switchDialog] ? `${stores[switchDialog].name}으로\n매장을 전환하시겠어요?` : ""}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setSwitchDialog(null) },
          { label: "전환하기", variant: "confirm", onClick: () => switchDialog !== null && handleSwitchConfirm(switchDialog) },
        ]}
      />
      <ConfirmDialog
        open={logoutDialog}
        onOpenChange={setLogoutDialog}
        title="로그아웃"
        description="로그아웃 하시겠어요?"
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setLogoutDialog(false) },
          { label: "로그아웃", variant: "confirm", onClick: handleLogout },
        ]}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start">
      <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)] flex-1 min-w-0">{value}</span>
    </div>
  );
}

function StoreInfoRow({ label, value, isLink, onCopy }: { label: string; value: string; isLink?: boolean; onCopy?: () => void }) {
  return (
    <div className={`flex gap-4 ${isLink ? 'pressable cursor-pointer' : ''}`} onClick={isLink ? onCopy : undefined}>
      <span className="text-[14px] font-medium text-[#70737B] w-[72px] flex-shrink-0">{label}</span>
      <span className={`text-[14px] font-medium ${isLink ? 'text-[#4261FF] underline' : 'text-[#19191B]'}`}>{value}</span>
    </div>
  );
}
