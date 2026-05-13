import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getMe, logout } from "@/api/public";

interface StoreInfo {
  id: number; name: string; code: string; industry: string;
  address: string; owner_name: string; phone: string;
  employee_count: number; created_at: string;
}

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<number | null>(null);
  const [switchDialog, setSwitchDialog] = useState<number | null>(null);
  const [logoutDialog, setLogoutDialog] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberInfo, setMemberInfo] = useState<{ birth: string; gender: string; phone: string } | null>(null);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [primaryStoreId, setPrimaryStoreId] = useState(() => Number(localStorage.getItem("currentStoreId") ?? 0));

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMe();
        setMemberName(me.name ?? "");
        setMemberInfo({
          birth: me.birth ? String(me.birth).replace(/-/g, ".") : "-",
          gender: me.gender === "female" ? "여자" : "남자",
          phone: me.phone ?? "-",
        });
        if (me.id) {
          const res = await fetch(`/api/owner/mypage/${me.id}/stores`, { credentials: "include" });
          if (res.ok) setStores(await res.json());
        }
      } catch {}
    };
    load();
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
    const targetStore = stores[storeIdx];
    if (!targetStore) return;
    localStorage.setItem("currentStoreId", String(targetStore.id));
    setPrimaryStoreId(targetStore.id);
    toast({ description: `${targetStore.name}으로 전환되었어요`, duration: 2000 });
    navigate("/owner/home", { replace: true });
  };

  const handleLogout = async () => {
    setLogoutDialog(false);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative font-[Pretendard]" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        {/* Header - 직원 화면과 높이/여백 통일 */}
        <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <button onClick={() => navigate('/owner/home')} className="pressable p-1">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>내 정보</h1>
        </div>
        <div className="border-b border-border" />

        {/* Profile Card - 직원 화면 스타일 통일 */}
        <div className="flex items-center gap-4 py-4 px-[20px]">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0 bg-[hsl(240,4.8%,95.9%)]">
            <img src="https://i.pravatar.cc/150?img=11" alt="프로필" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(240,7%,10%)]">{memberName}</span>
              <span className="text-[16px] tracking-[-0.02em] font-normal text-[hsl(223,5%,46%)]">사장님</span>
            </div>
            {stores[0] && (
              <div className="mt-1 flex">
                <span className="inline-flex items-center justify-center h-[28px] px-[10px] rounded-[4px] bg-primary/10 text-primary text-[14px] tracking-[-0.02em] font-medium whitespace-nowrap w-auto">
                  {stores[0].name} 가입
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
            <InfoRow label="생년월일" value={memberInfo?.birth ?? "-"} />
            <InfoRow label="성별" value={memberInfo?.gender ?? "-"} />
            <InfoRow label="전화번호" value={memberInfo?.phone ?? "-"} />
          </div>
        </section>

        <Divider />

        {/* 광고 배너 - 직원 화면과 100% 동일 규격 */}
        <div className="py-5 px-[20px]">
          <div className="h-[120px] rounded-[16px] bg-[#3DA8D5] flex items-center justify-center px-6 relative overflow-hidden shadow-sm">
            <div className="text-white text-center">
              <p className="text-[18px] font-bold leading-tight tracking-[-0.02em]">
                전국 스키장<br />리프트권 특가 모음
              </p>
              <p className="text-[12px] mt-2 opacity-80 font-medium tracking-[-0.01em]">
                25/26 NOL 스키 시즌
              </p>
            </div>

            {/* 우측 하단 인디케이터 - 직원 화면과 동일한 opacity-20 및 gap-1.5 적용 */}
            <div className="absolute bottom-3 right-6 flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20"></div>
            </div>
          </div>
        </div>

        <Divider />

        {/* 매장 정보 - px-[20px] 통일 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">매장 정보</h2>
          <div className="space-y-4">
            {stores.map((store, idx) => {
              const isPrimary = store.id === primaryStoreId;
              const openDate = store.created_at ? store.created_at.slice(0, 10).replace(/-/g, ".") : "-";
              return (
                <div key={store.id} className="border border-border rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-[#19191B]">{store.name}</h3>
                    {isPrimary ? (
                      <button onClick={() => setEditDialog(idx)}
                        className="pressable text-[12px] text-primary border border-primary rounded-full px-3 py-1 font-medium">
                        수정하기
                      </button>
                    ) : (
                      <button onClick={() => setSwitchDialog(idx)}
                        className="pressable text-[12px] text-muted-foreground border border-border rounded-full px-3 py-1 font-medium">
                        매장 전환 ↔
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <StoreInfoRow label="매장 코드" value={String(store.code)} isLink onCopy={() => handleCopyCode(String(store.code))} />
                    <StoreInfoRow label="업종" value={store.industry} />
                    <StoreInfoRow label="주소" value={store.address} />
                    <StoreInfoRow label="대표자명" value={store.owner_name} />
                    <StoreInfoRow label="대표 번호" value={store.phone} />
                    <StoreInfoRow label="총 직원 수" value={`${store.employee_count}명`} />
                    <StoreInfoRow label="개업일" value={openDate} />
                  </div>
                </div>
              );
            })}
            {stores.length === 0 && (
              <p style={{ fontSize: '14px', color: '#9EA3AD', textAlign: 'center', padding: '20px 0' }}>매장 정보를 불러오는 중...</p>
            )}
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

        <div className="pb-6 flex justify-center px-5">
          <button onClick={() => navigate("/account/withdrawal")}
            className="pressable text-center text-[13px] text-muted-foreground underline">
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={editDialog !== null}
        onOpenChange={(open) => !open && setEditDialog(null)}
        title="매장 정보 수정하기"
        description={editDialog !== null ? `${stores[editDialog]?.name ?? ""}\n매장 정보를 수정하시겠어요?` : ""}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setEditDialog(null) },
          { label: "수정하기", variant: "confirm", onClick: handleEditConfirm },
        ]}
      />
      <ConfirmDialog
        open={switchDialog !== null}
        onOpenChange={(open) => !open && setSwitchDialog(null)}
        title="매장 전환하기"
        description={switchDialog !== null ? `${stores[switchDialog]?.name ?? ""}으로\n매장을 전환하시겠어요?` : ""}
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

/* InfoRow - 직원 화면 InfoRow와 텍스트 스타일/간격 통일 */
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