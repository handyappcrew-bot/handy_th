// === 로그인 검증 타입 ===
export type LoginRequest = {
    phone: string;
    password: string;
}

// === 회원가입 타입 ===
export type SignupForm = {
    phone: string;
    password: string;
    name: string;
    birth: string;
    gender: string;
    imageUrl?: string;
    type: string;
}