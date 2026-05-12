interface PromoBannerProps {
  banners: { id: string; title: string; subtitle: string; bgColor: string }[];
}

const PromoBanner = ({ banners }: PromoBannerProps) => {
  if (banners.length === 0) return null;

  return (
    <div className="px-5">
      <div className="overflow-hidden rounded-2xl">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex h-[140px] items-center justify-between p-5"
            style={{ backgroundColor: banner.bgColor }}
          >
            <div>
              <p className="text-base font-bold text-white">{banner.title}</p>
              <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Dots indicator */}
      <div className="mt-2 flex justify-center gap-1.5">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-foreground" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBanner;
