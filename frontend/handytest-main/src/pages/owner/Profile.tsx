import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STORES = [
  {
    id: 1,
    name: "컴포즈커피 노량진점",
    code: "123456",
    category: "음식/카페",
    address: "서울특별시 동작구 노량진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
  {
    id: 2,
    name: "메가커피 노량진점",
    code: "111111",
    category: "음식/카페",
    address: "서울특별시 동작구 노량진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
];

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storeOrder, setStoreOrder] = useState([0, 1]);
  const [editDialog, setEditDialog] = useState<number | null>(null);
  const [switchDialog, setSwitchDialog] = useState<number | null>(null);
  const [logoutDialog, setLogoutDialog] = useState(false);

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
    toast({ description: "매장이 전환되었어요", duration: 2000 });
  };

  const handleLogout = () => {
    setLogoutDialog(false);
    toast({ description: "로그아웃 되었어요", duration: 2000 });
    navigate("/");
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
              <span className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(240,7%,10%)]">정수민</span>
              <span className="text-[16px] tracking-[-0.02em] font-normal text-[hsl(223,5%,46%)]">사장님</span>
            </div>
            <div className="mt-1 flex">
              <span className="inline-flex items-center justify-center h-[28px] px-[10px] rounded-[4px] bg-primary/10 text-primary text-[14px] tracking-[-0.02em] font-medium whitespace-nowrap w-auto">
                컴포즈커피 노량진점 가입 +261일
              </span>
            </div>
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
            <InfoRow label="생년월일" value="2001.02.03 (24세)" />
            <InfoRow label="성별" value="여자" />
            <InfoRow label="전화번호" value="010-5050-5050" />
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
            {storeOrder.map((storeIdx, orderPos) => {
              const store = STORES[storeIdx];
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
                    <StoreInfoRow label="매장 코드" value={store.code} isLink onCopy={() => handleCopyCode(store.code)} />
                    <StoreInfoRow label="업종" value={store.category} />
                    <StoreInfoRow label="주소" value={store.address} />
                    <StoreInfoRow label="대표자명" value={store.ceo} />
                    <StoreInfoRow label="대표 번호" value={store.phone} />
                    <StoreInfoRow label="총 직원 수" value={store.staffCount} />
                    <StoreInfoRow label="개업일" value={store.openDate} />
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
        description={editDialog !== null ? `${STORES[editDialog].name}\n매장 정보를 수정하시겠어요?` : ""}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setEditDialog(null) },
          { label: "수정하기", variant: "confirm", onClick: handleEditConfirm },
        ]}
      />
      <ConfirmDialog
        open={switchDialog !== null}
        onOpenChange={(open) => !open && setSwitchDialog(null)}
        title="매장 전환하기"
        description={switchDialog !== null ? `${STORES[switchDialog].name}으로\n매장을 전환하시겠어요?` : ""}
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