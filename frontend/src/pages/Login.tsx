import { useEffect, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { formatPhone } from "@/utils/valid";
import { useNavigate } from "react-router-dom";
import { getMyStores, getMe } from "@/api/public";

function storeUserContext(stores: any[], memberId?: number, preferRole: "owner" | "employee" = "owner") {
    // 이미 저장된 세션이 현재 stores 목록에 여전히 존재하면 그대로 유지 (세션 유지)
    const savedStoreMemberId = localStorage.getItem("currentStoreMemberId");
    const stillValid = savedStoreMemberId
        ? stores.find((s: any) => String(s.store_member_id) === savedStoreMemberId)
        : null;

    const ownerStore = stores.find((s: any) => s.role === "owner");
    const empStore = stores.find((s: any) => s.role === "employee");
    const fallback = preferRole === "employee" ? (empStore ?? ownerStore) : (ownerStore ?? empStore);
    const activeStore = stillValid ?? fallback;
    if (!activeStore) return;
    localStorage.setItem("currentRole", activeStore.role);
    localStorage.setItem("currentStoreId", String(activeStore.store_id));
    localStorage.setItem("currentStoreMemberId", String(activeStore.store_member_id));
    if (memberId != null) localStorage.setItem("currentMemberId", String(memberId));
}

const Login = () => {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
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
                const [stores, me] = await Promise.all([getMyStores(), getMe().catch(() => null)]);
                if (stores.length === 0) return;

                // 이전 세션이 여전히 유효하면 그쪽으로 이동
                const savedStoreMemberId = localStorage.getItem("currentStoreMemberId");
                const stillValid = savedStoreMemberId
                    ? stores.find((s: any) => String(s.store_member_id) === savedStoreMemberId)
                    : null;

                const hasOwner = stores.some((s: any) => s.role === "owner");
                const hasEmployee = stores.some((s: any) => s.role === "employee");
                const preferRole = (hasOwner && !hasEmployee) ? "owner" : "employee";
                storeUserContext(stores, me?.id, preferRole);

                const destRole = stillValid?.role ?? (hasOwner && !hasEmployee ? "owner" : "employee");
                navigate(destRole === "owner" ? "/owner/home" : "/employee/home", { replace: true });
            } catch {
                // 토큰 없거나 만료 → 로그인 화면 유지
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async () => {
        if (!hasInput) return;
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone: digits, password }),
            });

            let data: any = {};
            try { data = await res.json(); } catch { /* 빈 응답 무시 */ }

            if (!res.ok) {
                setErrorMsg(data.detail ?? "로그인 중 오류가 발생했습니다.");
                setError(true);
                return;
            }

            setError(false);
            const stores = data.stores ?? [];
            const hasOwner = stores.some((s: any) => s.role === "owner");
            const hasEmployee = stores.some((s: any) => s.role === "employee");

            let meId: number | undefined;
            try { meId = (await getMe()).id; } catch { /* 무시 */ }

            if (hasOwner && hasEmployee) {
                storeUserContext(stores, meId, "employee");
                navigate("/employee/home");
            } else if (hasOwner) {
                storeUserContext(stores, meId, "owner");
                navigate("/owner/home");
            } else {
                storeUserContext(stores, meId, "employee");
                navigate("/employee/home");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
            setError(true);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
        setPhone(formatPhone(raw));
        setError(false);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setError(false);
    };

    // 카카오 로그인
    const LoadKakaoLogin = () => { window.location.href = "/api/auth/kakao/login"; };
    // 구글 로그인
    const LoadGoogleLogin = () => { window.location.href = "/api/auth/google/login"; };
    // 애플 로그인
    const LoadAppleLogin = async () => {
        window.AppleID.auth.init({
            clientId: 'com.handy.handy3529',
            scope: 'name email',
            redirectURI: 'https://local.handy.com/api/auth/apple/callback',
            usePopup: true,
        });
        try {
            const response = await window.AppleID.auth.signIn();
            const { code, id_token } = response.authorization;
            const res = await fetch('/api/auth/apple/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: new URLSearchParams({ code, id_token }),
            });
            const data = await res.json();
            if (data.redirect === 'signup') window.location.href = '/#/signup?type=social';
            else if (data.redirect === 'onboarding') window.location.href = '/#/onboarding/member-type';
        } catch (error) {
            console.error('애플 로그인 실패', error);
        }
    };

    // 입력 필드 공통 스타일 (회원가입 화면과 동일 패턴)
    const phoneBorder = error
        ? "border-input-error"
        : phoneFocused ? "border-input-focus" : "border-input";
    const passwordBorder = error
        ? "border-input-error"
        : passwordFocused ? "border-input-focus" : "border-input";

    return (
        <div className="flex min-h-screen flex-col items-center bg-background px-6">
            {/* 로고 영역: 심볼 (52×77) + 타이포 (103×41) — 상단 마진 80px (375×812 기준, 시안보다 5px↑) */}
            <div className="mt-[80px] mb-12 flex flex-col items-center">
                <img
                    src="/images/login/symbol.png"
                    alt="Handy 심볼"
                    width={52}
                    height={77}
                    className="block"
                    draggable={false}
                />
                <img
                    src="/images/login/typo.png"
                    alt="Handy"
                    width={103}
                    height={41}
                    className="mt-3 block"
                    draggable={false}
                />
            </div>

            {/* 입력 폼 */}
            <div className="w-full max-w-sm flex flex-col">
                {/* Phone Input */}
                <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="휴대폰 번호"
                    value={phone}
                    onChange={handlePhoneChange}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className={`w-full h-[56px] rounded-2xl border-2 bg-background px-5 text-[16px] transition-colors ${phoneBorder}`}
                />

                {/* Password Input — 휴대폰 ↔ 비밀번호 16px */}
                <div className="relative mt-[16px]">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호"
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        className={`w-full h-[56px] rounded-2xl border-2 bg-background px-5 pr-14 text-[16px] transition-colors ${passwordBorder}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pressable absolute right-4 top-1/2 -translate-y-1/2 text-[#AAB4BF]"
                        aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                    >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-3 flex items-center gap-2 text-destructive text-[13px]">
                        <AlertCircle size={16} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login Button — 비밀번호 ↔ 로그인 30px */}
                <button
                    onClick={handleLogin}
                    disabled={!hasInput}
                    className={`pressable mt-[30px] w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-colors ${hasInput
                        ? "bg-primary text-primary-foreground"
                        : "btn-disabled"
                        }`}
                >
                    로그인
                </button>

                {/* Links: 비밀번호 찾기 | 회원가입 하기 — 로그인 버튼 ↔ 30px, medium */}
                <div className="mt-[30px] flex items-center justify-center gap-4 text-[14px] font-medium">
                    <button
                        type="button"
                        className="pressable text-[#70737B]"
                    >
                        비밀번호 찾기
                    </button>
                    <span className="h-3 w-px bg-border" />
                    <button
                        type="button"
                        onClick={() => navigate("/signup")}
                        className="pressable"
                        style={{ color: '#3E3E46' }}
                    >
                        회원가입 하기
                    </button>
                </div>
            </div>

            {/* 하단 간편 로그인 영역 */}
            <div className="mt-auto w-full max-w-sm pb-10">
                {/* 디바이더: 양옆 60px 마진 — 가로선이 화면 끝까지 닿지 않게 축소 */}
                <div className="mb-6 flex items-center gap-3 mx-[60px]">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[14px] font-medium text-[#AAB4BF]">간편 로그인</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* SNS 버튼 — 버튼 간 24px */}
                <div className="flex justify-center gap-6">
                    <button
                        onClick={LoadKakaoLogin}
                        className="pressable h-14 w-14"
                        aria-label="카카오로 로그인"
                    >
                        <img src="/images/login/kakao.png" alt="카카오" className="h-full w-full" draggable={false} />
                    </button>
                    <button
                        onClick={LoadAppleLogin}
                        className="pressable h-14 w-14"
                        aria-label="애플로 로그인"
                    >
                        <img src="/images/login/apple.png" alt="애플" className="h-full w-full" draggable={false} />
                    </button>
                    <button
                        onClick={LoadGoogleLogin}
                        className="pressable h-14 w-14"
                        aria-label="구글로 로그인"
                    >
                        <img src="/images/login/google.png" alt="구글" className="h-full w-full" draggable={false} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
