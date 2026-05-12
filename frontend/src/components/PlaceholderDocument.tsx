const PlaceholderDocument = () => (
  <div className="relative mx-auto w-[280px]">
    {/* Corner brackets */}
    <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-image-border rounded-tl-md" 
         style={{ borderColor: 'hsl(var(--image-border))' }} />
    <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-md"
         style={{ borderColor: 'hsl(var(--image-border))' }} />
    <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-md"
         style={{ borderColor: 'hsl(var(--image-border))' }} />
    <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-md"
         style={{ borderColor: 'hsl(var(--image-border))' }} />

    {/* Document */}
    <div className="bg-muted rounded-lg p-6 space-y-3">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium tracking-widest text-foreground">사 업 자 등 록 증</p>
        <p className="text-xs text-muted-foreground">(ex 일반과세자 )</p>
        <p className="text-xs text-muted-foreground">등록번호 : 000-00-00000</p>
      </div>
      <div className="space-y-2 mt-4">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-16 shrink-0">상　　호 :</span>
          <div className="h-2 bg-border rounded flex-1 max-w-[80px]" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-16 shrink-0">성　　명 :</span>
          <div className="h-2 bg-border rounded w-12" />
          <span className="text-xs text-muted-foreground">생년월일 :</span>
          <div className="h-2 bg-border rounded w-12" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-16 shrink-0">개업연월일 :</span>
          <div className="h-2 bg-border rounded flex-1 max-w-[80px]" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-20 shrink-0">사업장소재지 :</span>
          <div className="h-2 bg-border rounded flex-1" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-20 shrink-0">사업의종류 :</span>
          <div className="h-2 bg-border rounded flex-1 max-w-[60px]" />
        </div>
      </div>
      {/* Seal area */}
      <div className="flex items-center justify-center pt-2 opacity-20">
        <div className="w-16 h-16 rounded-full border-2 border-muted-foreground flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">국세청</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className="h-2 bg-border rounded w-24 mx-auto" />
        <p className="text-xs text-muted-foreground">20XX 년 XX 월 XX 일</p>
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs text-muted-foreground">○ ○ 세 무 서 장</p>
          <div className="w-4 h-4 rounded bg-destructive/30" />
        </div>
      </div>
    </div>
  </div>
);

export default PlaceholderDocument;
