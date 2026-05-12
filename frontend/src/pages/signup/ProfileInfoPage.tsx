import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, X, Check, CheckSquare, Square, ChevronRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const TERMS = [
  { id: "service", label: "서비스 이용약관 동의", required: true },
  { id: "privacy", label: "개인정보 수집 · 이용 동의", required: true },
  { id: "thirdParty", label: "개인정보 제 3자 제공 동의", required: true },
  { id: "location", label: "위치 정보 이용 동의", required: true },
];

const ProfileInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const phone = state?.phone || "";
  const password = state?.password || "";
  const type = location.state?.type || "normal";

  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [showBirthSheet, setShowBirthSheet] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);
  const [gender, setGender] = useState("");
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});

  const birthdate = birthYear && birthMonth && birthDay
    ? `${birthYear}.${String(birthMonth).padStart(2, "0")}.${String(birthDay).padStart(2, "0")}`
    : "";

  const canNext = name.trim().length > 0 && birthdate !== "" && gender !== "";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i).reverse();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const days = Array.from({ length: daysInMonth(tempYear, tempMonth) }, (_, i) => i + 1);

  const allRequiredAgreed = TERMS.filter((t) => t.required).every((t) => agreed[t.id]);
  const allAgreed = TERMS.every((t) => agreed[t.id]);

  const toggleAll = () => {
    if (allAgreed) {
      setAgreed({});
    } else {
      const all: Record<string, boolean> = {};
      TERMS.forEach((t) => (all[t.id] = true));
      setAgreed(all);
    }
  };

  const toggleTerm = (id: string) => {
    setAgreed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNextClick = () => {
    if (!canNext) return;
    setShowTermsSheet(true);
  };

  const handleAgreeSubmit = () => {
    if (!allRequiredAgreed) return;
    setShowTermsSheet(false);
    navigate("/profile-photo", {
      state: { phone, password, name, birthdate, gender, type },
    });
  };

  return (
    <>
      <PageLayout
        title={
          <>
            <h1 className="text-[26px] font-bold leading-tight text-foreground">회원 정보를</h1>
            <h1 className="text-[26px] font-bold leading-tight text-foreground">입력해주세요</h1>
          </>
        }
        subtitle="회원 식별을 위해 정보를 입력해 주세요."
        onBack={() => navigate("/password", { state: { phone } })}
        bottom={
          <button
            disabled={!canNext}
            onClick={handleNextClick}
            className={`w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${canNext
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
              }`}
          >
            다음
          </button>
        }
      >
        {/* Name */}
        <div>
          <label className="text-[15px] font-medium text-foreground">
            이름 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 text-[16px] outline-none"
          />
        </div>

        {/* Birthdate */}
        <div className="mt-5">
          <label className="text-[15px] font-medium text-foreground">
            생년월일 <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (birthYear) {
                setTempYear(birthYear);
                setTempMonth(birthMonth!);
                setTempDay(birthDay!);
              }
              setShowBirthSheet(true);
            }}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-3.5 text-[16px]"
          >
            <span className={birthdate ? "text-foreground" : "text-muted-foreground"}>
              {birthdate || "생년월일 선택"}
            </span>
            <ChevronDown size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Gender */}
        <div className="mt-5">
          <label className="text-[15px] font-medium text-foreground">
            성별 <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowGenderSheet(true)}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-3.5 text-[16px]"
          >
            <span className={gender ? "text-foreground" : "text-muted-foreground"}>
              {gender || "성별 선택"}
            </span>
            <ChevronDown size={20} className="text-muted-foreground" />
          </button>
        </div>
      </PageLayout>

      {/* Birthdate Bottom Sheet */}
      {showBirthSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowBirthSheet(false)}
          />
          <div className="relative rounded-t-2xl bg-background px-5 pb-8 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-foreground">생년월일을 선택해주세요</h3>
              <button onClick={() => setShowBirthSheet(false)}>
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <div className="flex gap-2">
              {/* Year */}
              <div className="flex-1">
                <label className="text-[13px] text-muted-foreground mb-1 block">년</label>
                <div className="h-[200px] overflow-y-auto rounded-xl border border-input">
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => setTempYear(y)}
                      className={`w-full px-3 py-2.5 text-[15px] text-center ${tempYear === y ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              {/* Month */}
              <div className="flex-1">
                <label className="text-[13px] text-muted-foreground mb-1 block">월</label>
                <div className="h-[200px] overflow-y-auto rounded-xl border border-input">
                  {months.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setTempMonth(m);
                        const maxDay = daysInMonth(tempYear, m);
                        if (tempDay > maxDay) setTempDay(maxDay);
                      }}
                      className={`w-full px-3 py-2.5 text-[15px] text-center ${tempMonth === m ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {/* Day */}
              <div className="flex-1">
                <label className="text-[13px] text-muted-foreground mb-1 block">일</label>
                <div className="h-[200px] overflow-y-auto rounded-xl border border-input">
                  {days.map((d) => (
                    <button
                      key={d}
                      onClick={() => setTempDay(d)}
                      className={`w-full px-3 py-2.5 text-[15px] text-center ${tempDay === d ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setBirthYear(tempYear);
                setBirthMonth(tempMonth);
                setBirthDay(tempDay);
                setShowBirthSheet(false);
              }}
              className="mt-5 w-full rounded-2xl bg-primary py-4 text-[17px] font-semibold text-primary-foreground"
            >
              선택 완료
            </button>
          </div>
        </div>
      )}

      {/* Gender Bottom Sheet */}
      {showGenderSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowGenderSheet(false)}
          />
          <div className="relative rounded-t-2xl bg-background px-5 pb-8 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-foreground">성별을 선택해주세요</h3>
              <button onClick={() => setShowGenderSheet(false)}>
                <X size={24} className="text-foreground" />
              </button>
            </div>
            {["남자", "여자"].map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGender(g);
                  setShowGenderSheet(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-[16px] mb-1 ${gender === g
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground"
                  }`}
              >
                {g}
                {gender === g && <Check size={20} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Terms Bottom Sheet */}
      {showTermsSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTermsSheet(false)}
          />
          <div className="relative rounded-t-2xl bg-background px-5 pb-8 pt-6">
            {/* Select all */}
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-3 rounded-xl border border-input px-4 py-3.5 mb-4"
            >
              {allAgreed ? (
                <CheckSquare size={22} className="text-primary" />
              ) : (
                <Square size={22} className="text-muted-foreground" />
              )}
              <span className="text-[16px] font-semibold text-foreground">전체약관 동의하기</span>
            </button>

            {/* Individual terms */}
            {TERMS.map((term) => (
              <button
                key={term.id}
                onClick={() => toggleTerm(term.id)}
                className="flex w-full items-center justify-between py-3 px-1"
              >
                <div className="flex items-center gap-3">
                  <Check
                    size={18}
                    className={agreed[term.id] ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className="text-[15px] text-foreground">
                    {term.label}{" "}
                    <span className="text-muted-foreground text-[13px]">
                      ({term.required ? "필수" : "선택"})
                    </span>
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}

            <button
              disabled={!allRequiredAgreed}
              onClick={handleAgreeSubmit}
              className={`mt-5 w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${allRequiredAgreed
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
                }`}
            >
              약관 동의하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileInfoPage;
