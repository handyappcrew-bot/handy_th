import { useEffect } from "react";

const AdBanner = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);
  return (
    <div className="px-5 w-full">
      <div className="overflow-hidden rounded-2xl bg-white/50 flex items-center justify-center" style={{ minHeight: '100px' }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", borderRadius: "16px" }}
          data-ad-client="ca-pub-2835570189350834"
          data-ad-slot="YOUR_AD_SLOT_ID"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        ></ins>
      </div>
    </div>
  );
};

export default AdBanner;
