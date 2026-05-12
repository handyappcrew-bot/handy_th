import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, User, AlertCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const ProfilePhotoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const phone = state?.phone || "";
  const password = state?.password || "";
  const name = state?.name || "";
  const birthdate = state?.birthdate || "";
  const gender = state?.gender || "";
  const type = state?.type || "normal";

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return;
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) return;

    // console.log(file.name);
    setPhotoUrl(file.name);

    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
  };


  const handleComplete = async () => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
          name,
          birth: birthdate,
          gender,
          imageUrl: photoUrl
        })
      });

      if (res.ok) {
        navigate("/signup-complete", {
          state: { name },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkip = async () => {

    console.log(phone)
    console.log(password)
    console.log(name)
    console.log(birthdate)
    console.log(gender)
    console.log(photoUrl)
    console.log(type)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password: password || "",
          name,
          birth: birthdate,
          gender,
          imageUrl: photoUrl,
          type
        })
      });

      if (res.ok) {
        navigate("/signup-complete", {
          state: { name },
        });
      }
    } catch (err) {
      console.error(err);
    }

  };

  return (
    <PageLayout
      title={
        <>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">프로필 사진을</h1>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">업로드해 주세요</h1>
        </>
      }
      subtitle="나중에 업로드하거나 수정할 수 있어요"
      onBack={() =>
        navigate("/profile-info", { state: { phone, password } })
      }
      bottom={
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSkip}
            className="w-full rounded-2xl py-4 text-[17px] font-semibold bg-primary text-primary-foreground"
          >
            회원가입 후 다음에 등록하기
          </button>
          <button
            disabled={!photoUrl}
            onClick={handleComplete}
            className={`w-full rounded-2xl py-4 text-[17px] font-semibold transition-colors ${photoUrl
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
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
          <div className="h-48 w-48 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="프로필" className="h-full w-full object-cover" />
            ) : (
              <User size={80} className="text-muted-foreground/50" />
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-muted border-2 border-background flex items-center justify-center"
          >
            <Camera size={20} className="text-muted-foreground" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="mt-6 flex items-center gap-1.5 text-muted-foreground">
          <AlertCircle size={16} />
          <span className="text-[13px]">5MB 이내 JPG, JPEG, PNG</span>
        </div>
        <p className="text-[13px] text-muted-foreground">이미지 파일만 업로드 할 수있어요</p>
      </div>
    </PageLayout>
  );
};

export default ProfilePhotoPage;
