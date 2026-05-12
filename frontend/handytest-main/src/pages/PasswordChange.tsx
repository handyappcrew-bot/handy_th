import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { changePassword } from "@/api/mypage";

const PwField = ({ label, value, onChange, show, onToggle, error }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; error?: string;
}) => (
  <div>
    <label className="text-[14px] font-medium text-[hsl(210,5%,16%)]">
      {label} <span className="text-destructive">*</span>
    </label>
    <div className="relative mt-2">
      <input
        type={show ? "text" : "password"} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label + " 입력"}
        className={`w-full h-[52px] rounded-xl border px-4 pr-12 text-[16px] text-[hsl(210,5%,16%)] placeholder:text-muted-foreground focus:outline-none ${error ? "border-destructive" : "border-border focus:border-primary"}`}
      />
      <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        {show ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>
    </div>
    {error && (
      <div className="flex items-center gap-1.5 mt-2">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-[13px] text-destructive">{error}</span>
      </div>
    )}
  </div>
);

const PasswordChange = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oldPasswordError, setOldPasswordError] = useState<string | undefined>();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/;
  const isNewValid = passwordRegex.test(newPassword);
  const isConfirmMatch = newPassword === confirmPassword && confirmPassword !== "";
  const isClientValid = isNewValid && isConfirmMatch;

  const handleSubmit = () => {
    setSubmitted(true);
    if (isClientValid) setConfirmDialogOpen(true);
  };

  const handleConfirmChange = async () => {
    setConfirmDialogOpen(false);
    setIsLoading(true);
    setOldPasswordError(undefined);
    try {
      await changePassword(oldPassword, newPassword);
      setCompleteDialogOpen(true);
    } catch (e) {
      setOldPasswordError(e instanceof Error ? e.message : "오류가 발생했어요. 다시 시도해주세요");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteNo = () => { setCompleteDialogOpen(false); navigate("/employee/profile"); };
  const handleCompleteLogout = () => { setCompleteDialogOpen(false); navigate("/"); };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative font-[Pretendard]" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>비밀번호 변경</h1>
      </div>

      <div className="px-[20px] pt-6 pb-8">
        <h2 className="text-[24px] font-bold text-[hsl(210,5%,16%)] leading-tight">변경할 비밀번호를<br />입력해주세요</h2>
        <p className="mt-2 text-[14px] text-[hsl(223,5%,46%)]">영문, 숫자를 조합한 8~16자를 입력해주세요</p>
        <div className="mt-8 space-y-6">
          <PwField label="기존 비밀번호" value={oldPassword} onChange={(v) => { setOldPassword(v); setOldPasswordError(undefined); }} show={showOld} onToggle={() => setShowOld(!showOld)}
            error={oldPasswordError ?? (submitted && !oldPassword ? "기존 비밀번호를 입력해주세요" : undefined)} />
          <PwField label="새 비밀번호" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)}
            error={submitted && !isNewValid && newPassword ? "올바르지 않은 비밀번호 형식이에요" : undefined} />
          <PwField label="새비밀번호 확인" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
            error={submitted && !isConfirmMatch && confirmPassword ? "비밀번호가 일치하지 않아요" : undefined} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-[20px] pb-8" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={handleSubmit} disabled={!oldPassword || !newPassword || !confirmPassword || isLoading}
          className={`w-full py-4 rounded-xl text-[16px] font-semibold ${oldPassword && newPassword && confirmPassword && !isLoading ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {isLoading ? "변경 중..." : "변경하기"}
        </button>
      </div>

      <ConfirmDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} title="비밀번호 변경"
        description="새로 입력한 비밀번호로 변경 하시겠어요?"
        buttons={[{ label: "취소", onClick: () => setConfirmDialogOpen(false), variant: "cancel" }, { label: "변경하기", onClick: handleConfirmChange }]} />

      <ConfirmDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen} title="비밀번호 변경 완료"
        description={<>비밀번호 변경이 완료되었어요<br />로그아웃 하시겠어요?</>}
        buttons={[{ label: "아니요", onClick: handleCompleteNo, variant: "cancel" }, { label: "로그아웃", onClick: handleCompleteLogout }]} />
    </div>
  );
};

export default PasswordChange;
