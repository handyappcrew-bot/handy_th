import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

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
    name: "컴포즈커피 노량진점",
    code: "456789",
    category: "음식/카페",
    address: "서울특별시 동작구 노량진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
];

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("정수민");
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

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
        {/* Header - 직원용 규격으로 통일 */}
        <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10 bg-white">
          <button onClick={() => navigate(-1)} className="pressable p-1">
            <ChevronLeft className="w-6 h-6 text-[#19191B]" />
          </button>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">내 정보 수정</h1>
        </div>
        <div className="border-b border-[#EEEEF0]" />

        {/* Profile Card */}
        <div className="flex items-center gap-4 py-6 px-5">
          <div className="relative">
            <div className="w-[80px] h-[80px] rounded-full bg-[#F7F7F8] overflow-hidden border border-[#EEEEF0]">
              <img src="https://i.pravatar.cc/150?img=11" alt="프로필" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setPhotoSheetOpen(true)}
              className="absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-[#4261FF] flex items-center justify-center shadow-md"
            >
              <span className="text-white text-[14px] font-bold leading-none">+</span>
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B]">{name}</span>
              <span className="text-[16px] font-medium text-[#70737B]">사장님</span>
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center justify-center px-3 h-[28px] rounded-[4px] bg-[#4261FF]/10 text-[#4261FF] text-[14px] font-medium tracking-[-0.02em]">
                컴포즈커피 노량진점 가입 +261일
              </span>
            </div>
          </div>
        </div>

        <Divider />

        {/* 인적 사항 */}
        <section className="py-5 px-5">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#19191B] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-[16px] font-medium text-[#70737B] w-[100px] flex-shrink-0">이름</span>
              <button
                onClick={() => { setNameInput(name); setNameSheetOpen(true); }}
                className="pressable flex-1 flex items-center justify-between px-4 h-[44px] bg-[#F7F7F8] border border-[#EEEEF0] rounded-lg text-[16px] font-medium text-[#19191B]"
              >
                <span>{name}</span>
                <span className="text-[#ADB1BA] text-[14px]">변경</span>
              </button>
            </div>
            <InfoRow label="생년월일" value="2001.02.03 (24세)" />
            <InfoRow label="성별" value="여자" />
            <InfoRow label="전화번호" value="010-5050-5050" />
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
            {STORES.map((store) => (
              <div key={store.id} className="border border-[#EEEEF0] rounded-2xl p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-[#19191B]">{store.name}</h3>
                  <button
                    onClick={() => navigate(`/owner/store/delete?store=${store.id - 1}`)}
                    className="pressable p-1.5 bg-[#F7F7F8] rounded-full text-[#70737B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <StoreInfoRow label="매장 코드" value={store.code} isLink onCopy={() => handleCopyCode(store.code)} />
                  <StoreInfoRow label="업종" value={store.category} />
                  <StoreInfoRow label="주소" value={store.address} />
                  <StoreInfoRow label="대표자명" value={store.ceo} />
                  <StoreInfoRow label="대표 번호" value={store.phone} />
                  <StoreInfoRow label="총 직원 수" value={store.staffCount} />
                  <StoreInfoRow label="개업일" value={store.openDate} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 회원탈퇴 버튼 (직원용과 통일) */}
        <div className="py-6 flex justify-center">
          <button onClick={() => navigate("/withdrawal")} className="pressable text-sm text-[#ADB1BA] underline underline-offset-2">회원탈퇴</button>
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-10">
          <button
            onClick={() => { toast({ description: "정보가 수정되었어요", duration: 2000 }); navigate(-1); }}
            className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold"
          >
            수정 완료
          </button>
        </div>

        {/* 프로필 사진 변경 바텀시트 */}
        {photoSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setPhotoSheetOpen(false)}>
            <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#19191B]">프로필 사진 변경</h3>
                <button className="pressable p-1" onClick={() => setPhotoSheetOpen(false)}><X className="w-6 h-6 text-[#19191B]" /></button>
              </div>
              <div className="px-4 pb-10">
                <button onClick={() => setPhotoSheetOpen(false)} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">
                  앨범에서 선택하기
                </button>
                <button onClick={() => { setName(""); setPhotoSheetOpen(false); }} className="pressable w-full text-left px-4 py-3.5 text-[16px] font-medium text-[#19191B] rounded-xl hover:bg-[#F7F7F8]">
                  기본 프로필로 변경하기
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* 이름 입력 바텀시트 */}
        {nameSheetOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setNameSheetOpen(false)}>
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
                  <p className="text-[13px] text-[#19191B]">
                    예) 핸디(홍길동)
                  </p>
                </div>
                <button
                  onClick={handleNameSave}
                  disabled={!nameInput.trim()}
                  className="pressable w-full h-[52px] rounded-xl bg-[#4261FF] text-white text-[16px] font-bold disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
                >
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