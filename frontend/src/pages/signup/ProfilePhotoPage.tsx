import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, AlertCircle, X, Image as ImageIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { signup } from "@/api/public";
import { clearProfileInfoDraft } from "@/utils/signupDraft";

const ProfilePhotoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const phone = state?.phone || "";
  const password = state?.password || "";
  const name = state?.name || "";
  const birthdate = state?.birthdate || "";
  const gender = state?.gender || "";
  const type = state?.type === "social" ? "social" : "general";
  const agreedTerms = state?.agreedTerms === true;

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // input value 리셋: 같은 파일 재선택도 동작하게
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setErrorMsg("JPG, JPEG, PNG 파일만 업로드 가능해요");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("이미지 크기는 5MB 이내여야 해요");
      return;
    }

    setErrorMsg("");
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowSourceSheet(false);
  };

  const submitSignup = async (includePhoto: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await signup({
        phone,
        password: type === "social" ? undefined : password,
        name,
        birth: birthdate,
        gender,
        type,
        agreedTerms,
        image: includePhoto ? photoFile : null,
      });
      clearProfileInfoDraft();
      navigate("/signup-complete", { state: { name } });
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "회원가입 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageLayout
        headerTitle="회원가입"
        title={
          <>
            <h2 className="text-[22px] font-bold leading-tight text-foreground">프로필 사진을</h2>
            <h2 className="text-[22px] font-bold leading-tight text-foreground">업로드해 주세요</h2>
          </>
        }
        subtitle="나중에 업로드하거나 수정할 수 있어요"
        onBack={() =>
          navigate("/profile-info", { state: { phone, password, type } })
        }
        bottom={
          <div className="flex flex-col gap-3">
            {/* 사진 미선택 시에만 '다음에 등록하기' 노출 */}
            {!photoFile && (
              <button
                onClick={() => submitSignup(false)}
                disabled={submitting}
                className="pressable w-full rounded-2xl py-4 text-[17px] font-semibold bg-primary text-primary-foreground disabled:bg-[#DBDCDF] disabled:text-white"
              >
                회원가입 후 다음에 등록하기
              </button>
            )}
            <button
              disabled={!photoFile || submitting}
              onClick={() => submitSignup(true)}
              className={`pressable w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${photoFile && !submitting
                ? "bg-primary text-primary-foreground"
                : "btn-disabled"
                }`}
            >
              회원가입 완료하기
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center mt-8">
          {/* Avatar */}
          <div className="relative">
            <div className="h-48 w-48 rounded-full overflow-hidden bg-transparent">
              {previewUrl ? (
                <img src={previewUrl} alt="프로필" className="h-full w-full object-cover" />
              ) : (
                <img
                  src="/images/icon/empty-profile.png"
                  alt="기본 프로필"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              )}
            </div>
            <button
              onClick={() => setShowSourceSheet(true)}
              className="pressable absolute bottom-2 right-2 h-12 w-12 flex items-center justify-center"
              aria-label="프로필 사진 업로드"
            >
              <img
                src="/images/icon/camera-upload.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full"
                draggable={false}
              />
            </button>
            {/* 숨김 input: 앨범/카메라 분기용 */}
            <input
              ref={albumInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-muted-foreground">
            <img
              src="/images/icon/small-notice.png"
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              draggable={false}
            />
            <span className="text-[13px]">5MB 이내 JPG, JPEG, PNG</span>
          </div>
          <p className="text-[13px] text-muted-foreground">이미지 파일만 업로드 할 수있어요</p>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-1.5 text-destructive">
              <AlertCircle size={16} />
              <span className="text-[13px]">{errorMsg}</span>
            </div>
          )}
        </div>
      </PageLayout>

      {/* 사진 업로드 소스 선택 바텀시트 */}
      {showSourceSheet && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end touch-none sheet-overlay">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSourceSheet(false)}
          />
          <div className="relative rounded-t-2xl bg-background px-5 pb-8 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-foreground">프로필 사진 업로드하기</h3>
              <button onClick={() => setShowSourceSheet(false)} className="pressable" aria-label="닫기">
                <X size={24} className="text-foreground" />
              </button>
            </div>

            <button
              onClick={() => albumInputRef.current?.click()}
              className="pressable flex w-full items-center gap-3 rounded-xl border border-input px-4 py-4 text-[16px] text-foreground mb-2"
            >
              <ImageIcon size={20} className="text-muted-foreground" />
              앨범에서 선택하기
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="pressable flex w-full items-center gap-3 rounded-xl border border-input px-4 py-4 text-[16px] text-foreground"
            >
              <Camera size={20} className="text-muted-foreground" />
              카메라 촬영하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePhotoPage;
