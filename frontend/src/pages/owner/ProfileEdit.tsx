import { useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { getMe } from "@/api/public";

interface StoreInfo {
  id: number; name: string; code: string; industry: string;
  address: string; owner_name: string; phone: string;
  employee_count: number; created_at: string;
}

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [memberInfo, setMemberInfo] = useState<{ birth: string; gender: string; phone: string } | null>(null);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMe();
        setName(me.name ?? "");
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

  const handleNameSave = () => {
    if (nameInput.trim()) {
      setName(nameInput.trim());
      setNameSheetOpen(false);
      toast({ description: "이름이 변경되었어요", duration: 2000 });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ description: "매장코드가 복사되었어요", duration: 2000 });
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto bg-white font-[Pretendard] relative">
      <div className="pb-24">
        <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10 bg-white">
          <button onClick={() => navigate(-1)} className="pressable p-1">
            <ChevronLeft className="w-6 h-6 text-[#19191B]" />
          </button>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">내 정보 수정</h1>
        </div>
        <div className="border-b border-[#EEEEF0]" />

        <div className="flex items-center gap-4 py-6 px-5">
          <div className="relative">
            <div className="w-[80px] h-[80px] rounded-full bg-[#F7F7F8] overflow-hidden border border-[#EEEEF0]">
              <img src="https://i.pravatar.cc/150?img=11" alt="프로필" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => setPhotoSheetOpen(true)} className="absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-[#4261FF] flex items-center justify-center shadow-md">
              <span className="text-white text-[14px] font-bold leading-none">+</span>
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">{name}</span>
              <span className="text-[16px] font-medium text-[#70737B]">사장님</span>
            </div>
            {stores[0] && (
              <div className="mt-1">
                <span className="inline-flex items-center justify-center px-3 h-[28px] rounded-[4px] bg-[#4261FF]/10 text-[#4261FF] text-[14px] font-medium tracking-[-0.02em]">
                  {stores[0].name} 가입
                </span>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <section className="py-5 px-5">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-[16px] font-medium text-[#70737B] w-[100px] flex-shrink-0">이름</span>
              <button onClick={() => { setNameInput(name); setNameSheetOpen(true); }}
                className="pressable flex-1 flex items-center justify-between px-4 h-[44px] bg-[#F7F7F8] border border-[#EEEEF0] rounded-lg text-[16px] font-medium text-[#19191B]">
                <span>{name}</span>
                <span className="text-[#ADB1BA] text-[14px]">변경</span>
              </button>
            </div>
            <InfoRow label="생년월일" value={memberInfo?.birth ?? "-"} />
            <InfoRow label="성별" value={memberInfo?.gender ?? "-"} />
            <InfoRow label="전화번호" value={memberInfo?.phone ?? "-"} />
          </div>
        </section>

        <Divider />

        <div className="px-5 py-1">
          <button onClick={() => navigate("/profile/edit/password")} className="pressable flex items-center justify-between w-full py-4">
            <span className="text-[16px] font-medium tracking-[-0.02em] text-[#70737B]">비밀번호 변경</span>
            <span className="text-[#ADB1BA] text-[20px] font-light">›</span>
          </button>
        </div>

        <Divider />

        <section className="py-5 px-5">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B] mb-4">매장 정보</h2>
          <div className="space-y-4">
            {stores.map((store) => {
              const openDate = store.created_at ? store.created_at.slice(0, 10).replace(/-/g, ".") : "-";
              return (
                <div key={store.id} className="border border-[#EEEEF0] rounded-2xl p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-bold text-[#19191B]">{store.name}</h3>
                  </div>
                  <div className="space-y-2.5">
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
            {stores.length === 0 && <p style={{ fontSize: '14px', color: '#9EA3AD' }}>매장 정보를 불러오는 중...</p>}
          </div>
        </section>

        <div className="py-6 flex justify-center">
          <button onClick={() => navigate("/withdrawal")} className="pressable text-sm text-[#ADB1BA] underline underline-offset-2">회원탈퇴</button>
        </div>

        <div className="px-5 pb-10">
          <button onClick={() => { toast({ description: "정보가 수정되었어요", duration: 2000 }); navigate(-1); }}
            className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold">
            수정 완료
          </button>
        </div>

        {photoSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setPhotoSheetOpen(false)}>
            <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#19191B]">프로필 사진 변경</h3>
                <button className="pressable p-1" onClick={() => setPhotoSheetOpen(false)}><X className="w-6 h-6 text-[#19191B]" /></button>
              </div>
              <div className="px-4 pb-10">
                <button onClick={() => setPhotoSheetOpen(false)} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">앨범에서 선택하기</button>
                <button onClick={() => setPhotoSheetOpen(false)} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">기본 프로필로 변경하기</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {nameSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setNameSheetOpen(false)}>
            <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#19191B]">이름 입력하기</h3>
                <button className="pressable p-1" onClick={() => setNameSheetOpen(false)}><X className="w-6 h-6 text-[#19191B]" /></button>
              </div>
              <div className="px-6 pb-10 space-y-4">
                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="이름 입력"
                  className="w-full h-[52px] px-4 border border-[#EEEEF0] rounded-xl bg-white focus:outline-none focus:border-[#4261FF] text-[16px]" />
                <button onClick={handleNameSave} disabled={!nameInput.trim()}
                  className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]">
                  입력 완료
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
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
