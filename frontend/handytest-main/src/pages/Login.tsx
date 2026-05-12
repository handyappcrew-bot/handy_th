import { useEffect, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { formatPhone } from "@/utils/valid";
import { LoginRequest } from "@/types/login";
import { useNavigate } from "react-router-dom";
import { getMyStores } from "@/api/public";

const Login = () => {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("010");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


    const digits = phone.replace(/ /g, "");
    const hasInput = /^010\d{8}$/.test(digits) && password.length > 0;

    // 컴포넌트 마운트 시 토큰 확인
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const stores = await getMyStores();
                if (stores.length === 0) return;
                const hasOwner = stores.some((s: any) => s.role === "사장");
                const hasEmployee = stores.some((s: any) => s.role === "직원");
                if (hasOwner && !hasEmployee) navigate("/owner/home", { replace: true });
                else navigate("/employee/home", { replace: true });
            } catch {
                // 토큰 없거나 만료 → 로그인 화면 유지
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async () => {
        try {
            if (hasInput) {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phone: digits,
                        password: password
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    setErrorMsg(data.detail);
                    setError(true);
                    return;
                }

                if (res.ok) {
                    setError(false);
                    const stores = data.stores ?? [];
                    const hasOwner = stores.some((s: any) => s.role === "사장");
                    const hasEmployee = stores.some((s: any) => s.role === "직원");

                    if (hasOwner && hasEmployee) {
                        navigate("/select-role"); // 혼재 시 선택 화면
                    } else if (hasOwner) {
                        navigate("/owner/home");
                    } else {
                        navigate("/employee/home");
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err);
            setError(true);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
        // ✅ 010 시작 강제
        if (!raw.startsWith("010")) {
            if (raw.length <= 3) {
                raw = "010".slice(0, raw.length);
            } else {
                raw = "010" + raw.slice(3);
            }
        }

        // ✅ 010 삭제 방지
        if (raw.length < 3) return;

        const formatted = formatPhone(raw);

        setPhone(formatted);
        setError(false);
    };

    // 비밀번호 변경
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError(false);
    };

    // 카카오 로그인 
    const LoadKakaoLogin = () => {
        window.location.href = "/api/auth/kakao/login";
    };

    // 구글 로그인
    const LoadGoogleLogin = () => {
        window.location.href = "/api/auth/google/login";
    }

    // 애플 로그인
    const LoadAppleLogin = async () => {
        window.AppleID.auth.init({
            clientId: 'com.handy.handy3529',
            scope: 'name email',
            redirectURI: 'https://local.handy.com/api/auth/apple/callback',
            usePopup: true  // ← 이게 핵심!
        });

        try {
            const response = await window.AppleID.auth.signIn();
            const { code, id_token } = response.authorization;

            const res = await fetch('/api/auth/apple/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ code, id_token })
            });

            const data = await res.json();

            if (data.redirect === 'signup') {
                window.location.href = '/#/signup?type=social';
            } else if (data.redirect === 'onboarding') {
                window.location.href = '/#/onboarding/member-type';
            }
        } catch (error) {
            console.error('애플 로그인 실패', error);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center bg-background px-6">
            {/* Logo */}
            <div className="mt-24 mb-16 text-center">
                <img src="/images/logo.png" alt="로고" />
                <p className="text-base text-muted-foreground">간단하고 유용한 핸디</p>
            </div>

            {/* Form */}
            <div className="w-full max-w-sm flex flex-col gap-4">
                {/* Phone Input */}
                <div className="relative">
                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="휴대폰 번호"
                        value={phone}
                        onChange={handlePhoneChange}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        className={`w-full h-[48px] rounded-lg border-2 bg-background px-4 py-4 text-base outline-none transition-colors placeholder:text-muted-foreground ${error
                            ? "border-input-error"
                            : phoneFocused
                                ? "border-input-focus"
                                : "border-input"
                            }`}
                    />
                </div>

                {/* Password Input */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호"
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        className={`w-full h-[48px] rounded-lg border-2 bg-background px-4 py-4 pr-12 text-base outline-none transition-colors placeholder:text-muted-foreground ${error
                            ? "border-input-error"
                            : passwordFocused
                                ? "border-input-focus"
                                : "border-input"
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle size={18} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    className={`mt-2 w-full h-[56px] rounded-lg py-4 text-base font-semibold transition-colors text-primary-foreground cursor-pointer ${hasInput
                        ? "bg-primary"
                        : "bg-secondary"
                        }`}
                >
                    로그인
                </button>

                {/* Links */}
                <div className="flex items-center justify-center gap-4 text-sm text-foreground mt-3">
                    <button className="hover:underline text-[#70737B]">비밀번호 찾기</button>
                    <span className="text-border">|</span>
                    <button className="hover:underline" onClick={() => { navigate("/signup") }}>회원가입 하기</button>
                </div>
            </div>

            {/* Social Login */}
            <div className="mt-12 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">간편 로그인</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex justify-center gap-6">
                    {/* KakaoTalk */}
                    <button onClick={LoadKakaoLogin} className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(51,100%,50%)]">
                        <span className="text-xs font-bold text-[hsl(0,0%,13%)]">카카오</span>
                    </button>
                    {/* Apple */}
                    <button onClick={LoadAppleLogin} className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-background">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                    </button>
                    {/* Google */}
                    <button onClick={LoadGoogleLogin} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-input bg-background">
                        <svg viewBox="0 0 24 24" className="h-6 w-6">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* [임시용] 추후 로그인 구현 시 삭제 */}
            <div>
                <button onClick={() => navigate("/employee/home")}>직원 관리</button>
            </div>
        </div>
    );
};

export default Login;
