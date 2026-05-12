import { useState } from "react";
import { Camera, CameraResultType } from "@capacitor/camera";

export default function OpenCamera() {
  // 저장할 이미지
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri
    });

    setImageUrl(image.webPath ?? null);
  };

  return (
    <div className="p-4">
      <button
        onClick={takePhoto}
        className="bg-primary text-white px-4 py-2 rounded-lg"
      >
        사진 찍기
      </button>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="촬영 이미지"
          className="mt-4 rounded-lg"
        />
      )}
    </div>
  );
}
