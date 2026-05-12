import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STORES = [
  {
    id: 1,
    name: "컴포즈커피 노랑진점",
    code: "123456",
    category: "음식/카페",
    address: "서울특별시 동작구 노랑진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
  {
    id: 2,
    name: "컴포즈커피 노랑진점",
    code: "456789",
    category: "음식/카페",
    address: "서울특별시 동작구 노랑진동 89-9 1층",
    ceo: "김준서",
    phone: "02-1234-5678",
    staffCount: "21명",
    openDate: "2023.11.22",
  },
];

const CAUTION_ITEMS = [
  "해당 매장에서 근무 중인 모든 직원의 정보가 삭제되어 조회할 수 없어요.",
  "등록된 매장의 매출 및 급여 정보가 삭제되고 복구되지 않아요.",
  "지금까지 누적된 직원 근태 정보를 더 이상 확인할 수 없어요.",
  "매장에 등록된 전 직원에게서도 매장 정보가삭제되어 중요한 정보를 열람할 수 없어요.",
  "매장에 등록된 직원 계정도 함께 매장 이용이 제한 돼요.",
];

export default function StoreDelete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeIndex = parseInt(searchParams.get("store") || "0");
  const store = STORES[storeIndex] || STORES[0];

  const [step, setStep] = useState<"caution" | "confirm">("caution");
  const [agreed, setAgreed] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleDelete = () => {
    setDeleteDialog(false);
    toast({ description: "매장이 삭제되었어요", duration: 2000 });
    navigate("/owner/profile/edit");
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="pb-24">
      {/* Header */}
      <div className="flex items-center h-14 px-5 border-b border-border sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => step === "caution" ? navigate(-1) : setStep("caution")} className="mr-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[18px] font-bold text-foreground">매장 삭제</h1>
      </div>

      {step === "caution" ? (
        <div className="">
          <div className="px-5 py-6">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              매장 삭제 전<br />유의사항을 확인해 주세요
            </h2>

            <div className="mt-6 bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-[14px] font-medium text-foreground">매장 삭제 전 유의사항</span>
              </div>
              <ol className="space-y-4 pl-1">
                {CAUTION_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[14px] text-muted-foreground shrink-0">{i + 1}.</span>
                    <span className="text-[14px] text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="px-5 pb-8">
            <button
              onClick={() => setAgreed(!agreed)}
              className="flex items-start gap-3 mb-4"
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "bg-primary border-primary" : "border-border"}`}>
                {agreed && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              <span className="text-[14px] text-foreground text-left leading-relaxed">
                매장 삭제 시 모든 데이터가 삭제되며 복구되지 않음을 확인했습니다.
              </span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3.5 rounded-xl border border-border text-[15px] text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!agreed}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-40"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="">
          <div className="px-5 py-6">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              삭제할 매장 정보를<br />다시 한 번 확인해 주세요
            </h2>

            <div className="mt-6 border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                <span className="text-[18px]">🏪</span>
                <span className="text-[16px] font-bold text-foreground">{store.name}</span>
              </div>
              <div className="space-y-3">
                <ConfirmRow label="업종" value={store.category} />
                <ConfirmRow label="주소" value={store.address} />
                <ConfirmRow label="대표자명" value={store.ceo} />
                <ConfirmRow label="대표 번호" value={store.phone} />
                <ConfirmRow label="매장 코드" value={store.code} isCode />
                <ConfirmRow label="총 직원 수" value={store.staffCount} />
                <ConfirmRow label="개업일" value={store.openDate} />
              </div>
            </div>
          </div>

          <div className="px-5 pb-8">
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3.5 rounded-xl border border-border text-[15px] text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={() => setDeleteDialog(true)}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="매장 삭제"
        description={"정말로 매장을 삭제하시겠어요?\n삭제 시 복구가 불가해요"}
        buttons={[
          { label: "취소", variant: "cancel", onClick: () => setDeleteDialog(false) },
          { label: "삭제하기", variant: "danger", onClick: handleDelete },
        ]}
      />
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, isCode }: { label: string; value: string; isCode?: boolean }) {
  return (
    <div className="flex gap-4">
      <span className="text-[14px] text-muted-foreground min-w-[72px] shrink-0">{label}</span>
      <span className={`text-[14px] ${isCode ? "text-primary font-medium" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
