
// 전화번호 유효성 검사
export const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
};

export const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    return /^010\d{8}$/.test(digits);
}