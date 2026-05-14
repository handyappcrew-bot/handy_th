import { useEffect, useState } from "react";
import { ChevronLeft, CheckCircle2, Pencil } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getMyInfo } from "@/api/employee";
import { logout } from "@/api/public";
import { getPhotoUrl } from "@/utils/function";
import { onProfileImageChange } from "@/utils/profileImageEvents";
import { useToast } from "@/hooks/use-toast";
import AdBanner from "@/components/AdBanner";

const Divider = () => <div className="w-full h-[12px] bg-[#F7F7F8]" />;

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
  schedule: { day: string; time: string; tags: string[] }[];  // 추가
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ label: string; url: string } | null>(null);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(profileData.account_number?.replace(/-/g, "") ?? "");
    toast({ description: "계좌번호가 복사되었어요", duration: 2000 });
  };

  const handleLogout = async () => {
    setLogoutOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      navigate("/");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storeId = Number(localStorage.getItem("currentStoreId") ?? 1);
        const data = await getMyInfo(storeId);
        setProfileData(data);
      } catch (err) {
        console.error(err);
        // 로컬 개발: 백엔드 없을 때 빈 프로필로 화면 표시
        if (import.meta.env.DEV) {
          setProfileData({} as any);
        }
      }
    };
    fetchProfile();
  }, [location.key]);

  // ProfileEdit에서 사진 변경 시 즉시 반영 (서버 URL이 없으면 로컬 미리보기 사용)
  useEffect(() => {
    return onProfileImageChange(({ imageUrl, previewUrl }) => {
      setProfileData((prev) => {
        if (!prev) return prev;
        const next = previewUrl ?? imageUrl ?? null;
        return { ...prev, image_url: next };
      });
    });
  }, []);

  if (!profileData) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto flex items-center justify-center">
        <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
              animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes navDotBounce {
            0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
            40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen font-[Pretendard]" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate("/employee/home")} className="pressable p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>내 정보</h1>
      </div>

      <div className="border-b border-border" />

      <div>
        {/* Profile Card */}
        <div className="flex items-center gap-4 py-4 px-[20px]">
          <div className="w-[80px] h-[80px] rounded-full bg-muted overflow-hidden flex-shrink-0">
            {profileData.image_url ? (
              <img src={getPhotoUrl(profileData.image_url)} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[10px]">
              <span className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(240,7%,10%)]">{profileData.name}</span>
              <span className="text-[16px] tracking-[-0.02em] font-normal text-[hsl(223,5%,46%)]">{profileData.employee_type}</span>
            </div>
            <div className="mt-1">
              <span className="inline-flex items-center justify-center h-[28px] px-[10px] rounded-[4px] bg-primary/10 text-primary text-[14px] tracking-[-0.02em] font-medium whitespace-nowrap w-auto">
                {profileData.store_name} 입사 +{profileData.days_since_joined}일
              </span>
            </div>
          </div>
          <button className="pressable p-2 self-start mt-1" onClick={() => navigate("/employee/profile/edit", { state: { profileData } })}>
            <Pencil className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <Divider />
        {/* 인적 사항 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">인적 사항</h2>
          <div className="space-y-3">
            <InfoRow label="생년월일" value={profileData.birth ? `${profileData.birth} (${profileData.age}세)` : "-"} />
            <InfoRow label="성별" value={profileData.gender ?? "-"} />
            <InfoRow label="전화번호" value={profileData.phone} />
            <InfoRow label="은행" value={profileData.bank ?? "-"} />
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">계좌번호</span>
              <button
                onClick={handleCopyAccount}
                className="pressable text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)] underline underline-offset-2 decoration-foreground/30"
              >
                {profileData.account_number ?? "-"}
              </button>
            </div>
          </div>
        </section>

        <Divider />
        {/* 계약 정보 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">계약 정보</h2>
          <div className="space-y-3">
            <InfoRow label="고용형태" value={profileData.employee_type ?? "-"} />
            <InfoRow label="입사일" value={`${profileData.joined_at} (+${profileData.days_since_joined}일)`} />
            <InfoRow label="수습" value={profileData.is_probation ? "수습 적용" : "수습 미적용"} />
            <InfoRow label="급여주기" value={profileData.salary_cycle ?? "-"} />
            <InfoRow label="시급" value={profileData.hourly_rate ? `${profileData.hourly_rate.toLocaleString()}원` : "-"} />
            <InfoRow label="급여일" value={`${profileData.salary_day}일`} />
            {/* 근무일 */}
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">근무일</span>
              <div className="flex-1 space-y-2">
                {(profileData.schedule ?? []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <span className="text-[16px] tracking-[-0.02em] font-semibold text-[hsl(210,5%,16%)] w-6">{s.day}</span>
                    <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">{s.time}</span>
                    <div className="flex gap-1">
                      {s.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: tag === '오픈' ? '#FDF9DF' : tag === '미들' ? '#ECFFF1' : '#E8F9FF',
                            color: tag === '오픈' ? '#FFB300' : tag === '미들' ? '#1EDC83' : '#14C1FA',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Divider />
        {/* 광고 배너 */}
        <section className="py-4">
          <AdBanner />
        </section>

        <Divider />
        {/* 세금 */}
        <section className="py-5 px-[20px]">
          <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] mb-4">세금</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">소득세</span>
              <div className="flex-1 space-y-1">
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">소득세 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.income_tax != null ? `${profileData.income_tax}%` : '-'}</span></p>
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">지방소득세 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.local_income_tax != null ? `${profileData.local_income_tax}%` : '-'}</span></p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">4대 보험</span>
              <div className="flex-1 space-y-1">
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">국민연금 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.national_pension_tax != null ? `${profileData.national_pension_tax}%` : '-'}</span></p>
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">건강보험 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.health_insurance_tax != null ? `${profileData.health_insurance_tax}%` : '-'}</span></p>
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">장기요양 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.long_term_care_tax != null ? `${profileData.long_term_care_tax}%` : '-'}</span></p>
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">고용보험 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.employment_insurance_tax != null ? `${profileData.employment_insurance_tax}%` : '-'}</span></p>
                <p className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)]">산재보험 <span className="font-normal text-[hsl(223,5%,46%)]">{profileData.industrial_accident_tax != null ? `${profileData.industrial_accident_tax}%` : '-'}</span></p>
              </div>
            </div>
          </div>
        </section>

        <Divider />
        {/* 계약서 */}
        <section className="py-5 px-[20px]">
          <div className="flex items-center mb-4">
            <h2 className="text-[20px] tracking-[-0.02em] font-bold text-[hsl(210,5%,16%)] w-[100px] flex-shrink-0">계약서</h2>
            <span className={`inline-flex items-center gap-1.5 text-[14px] tracking-[-0.02em] font-medium ${[profileData.resume, profileData.employment_contract, profileData.health_certificate].every(Boolean) ? "text-[hsl(145,63%,42%)]" : "text-destructive"}`}>
              <CheckCircle2 className="w-5 h-5" />
              {[profileData.resume, profileData.employment_contract, profileData.health_certificate].every(Boolean) ? "필수 계약서 제출 완료" : "필수 계약서 제출 미완료"}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "이력서", url: profileData.resume },
              { label: "근로계약서", url: profileData.employment_contract },
              { label: "보건증", url: profileData.health_certificate },
            ].map(({ label, url }) => (
              <div key={label} className="flex items-start">
                <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">{label}</span>
                {url ? (
                  <button
                    onClick={() => setViewingDoc({ label, url })}
                    className="pressable text-[16px] tracking-[-0.02em] text-primary font-medium underline underline-offset-2"
                  >
                    {label} 보기
                  </button>
                ) : (
                  <span className="text-[16px] tracking-[-0.02em] text-[hsl(223,5%,46%)]">미제출</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* 로그아웃 */}
        <div className="py-8 flex justify-center px-[20px]">
          <button
            onClick={() => setLogoutOpen(true)}
            className="pressable text-sm text-muted-foreground underline underline-offset-2"
          >
            로그아웃
          </button>
        </div>
      </div>

      <ConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} title="로그아웃"
        description="로그아웃 하시겠어요?"
        buttons={[{ label: "취소", onClick: () => setLogoutOpen(false), variant: "cancel" }, { label: "확인", onClick: handleLogout }]} />

      {/* 계약서 보기 팝업 */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="text-lg font-bold text-foreground px-5 pt-5 pb-3">{viewingDoc?.label}</DialogTitle>
          <DialogDescription className="sr-only">계약서 파일</DialogDescription>
          <div className="w-full overflow-auto" style={{ maxHeight: '70vh' }}>
            {viewingDoc?.url && (
              viewingDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getPhotoUrl(viewingDoc.url)}
                  className="w-full"
                  style={{ height: '60vh', border: 'none' }}
                  title={viewingDoc.label}
                />
              ) : (
                <img
                  src={getPhotoUrl(viewingDoc.url)}
                  alt={viewingDoc.label}
                  className="w-full h-auto object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start">
    <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(223,5%,46%)] w-[100px] flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-[16px] tracking-[-0.02em] font-medium text-[hsl(210,5%,16%)] flex-1 min-w-0">{value}</span>
  </div>
);

export default Profile;