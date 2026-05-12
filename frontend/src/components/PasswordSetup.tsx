import { useState, useMemo } from "react";
import { ChevronLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const PASSWORD_REGEX = /^[A-Za-z0-9]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 16;


const PasswordSetup = ({ onNext }: PasswordSetupProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmTouched, setConfirmTouched] = useState(false);

    const passwordValid = useMemo(() => {
        if (!password) return null;
        return (
            PASSWORD_REGEX.test(password) &&
            password.length >= PASSWORD_MIN &&
            password.length <= PASSWORD_MAX
        );
    }, [password]);

    const passwordsMatch = useMemo(() => {
        if (!confirmPassword) return null;
        return password === confirmPassword;
    }, [password, confirmPassword]);

    const isNextEnabled = passwordValid === true && passwordsMatch === true;

    const handlePasswordChange = (value: string) => {
        const filtered = value.replace(/[^A-Za-z0-9]/g, "").slice(0, PASSWORD_MAX);
        setPassword(filtered);
        if (!passwordTouched) setPasswordTouched(true);
    };

    const handleConfirmChange = (value: string) => {
        const filtered = value.replace(/[^A-Za-z0-9]/g, "").slice(0, PASSWORD_MAX);
        setConfirmPassword(filtered);
        if (!confirmTouched) setConfirmTouched(true);
    };

    const getPasswordBorderClass = () => {
        if (!passwordTouched || !password) return "border-input";
        return passwordValid ? "border-input" : "border-destructive";
    };

    const getConfirmBorderClass = () => {
        if (!confirmTouched || !confirmPassword) return "border-input";
        return passwordsMatch ? "border-input" : "border-destructive";
    };

    return (
        <div className="flex flex-col min-h-screen px-5 pt-14 pb-8">
            <button className="self-start -ml-1 p-1 text-primary">
                <ChevronLeft className="w-7 h-7" />
            </button>

            <div className="mt-6 mb-2">
                <h1 className="text-[26px] font-bold leading-tight text-foreground">
                    비밀번호를
                    <br />
                    입력해주세요
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                    영문, 숫자를 조합한 8~16자를 입력해주세요.
                </p>
            </div>

            {/* Password field */}
            <div className="mt-8">
                <label className="text-[15px] font-medium text-foreground">
                    비밀번호 <span className="text-destructive">*</span>
                </label>
                <div className={`mt-2 flex items-center rounded-xl border-2 ${getPasswordBorderClass()} bg-background px-4 py-3.5 transition-colors`}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호 입력"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className="flex-1 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground outline-none"
                        maxLength={PASSWORD_MAX}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-muted-foreground">
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                </div>
                {passwordTouched && password && (
                    <div className={`mt-2 flex items-center gap-1.5 text-[13px] ${passwordValid ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                        {passwordValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{passwordValid ? "사용 가능한 비밀번호에요" : "올바르지 않은 비밀번호 형식이에요"}</span>
                    </div>
                )}
            </div>

            {/* Confirm password field */}
            <div className="mt-6">
                <label className="text-[15px] font-medium text-foreground">
                    비밀번호 확인 <span className="text-destructive">*</span>
                </label>
                <div className={`mt-2 flex items-center rounded-xl border-2 ${getConfirmBorderClass()} bg-background px-4 py-3.5 transition-colors`}>
                    <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="비밀번호 확인"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmChange(e.target.value)}
                        className="flex-1 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground outline-none"
                        maxLength={PASSWORD_MAX}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="ml-2 text-muted-foreground">
                        {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                </div>
                {confirmTouched && confirmPassword && (
                    <div className={`mt-2 flex items-center gap-1.5 text-[13px] ${passwordsMatch ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                        {passwordsMatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{passwordsMatch ? "비밀번호가 일치해요" : "비밀번호가 일치하지 않아요"}</span>
                    </div>
                )}
            </div>

            <div className="flex-1" />

            <button
                disabled={!isNextEnabled}
                onClick={onNext}
                className={`w-full py-4 rounded-xl text-[17px] font-semibold transition-colors ${isNextEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
            >
                다음
            </button>
        </div>
    );
};

export default PasswordSetup;
