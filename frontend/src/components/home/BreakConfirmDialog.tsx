import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface BreakConfirmDialogProps {
  open: boolean;
  type: "start" | "end";
  onConfirm: () => void;
  onCancel: () => void;
}

const BreakConfirmDialog = ({ open, type, onConfirm, onCancel }: BreakConfirmDialogProps) => (
  <ConfirmDialog
    open={open} onOpenChange={(v) => { if (!v) onCancel(); }}
    title={type === "start" ? "휴게 시작하기" : "휴게 종료하기"}
    description={type === "start" ? "휴게를 시작 하시겠어요?" : "휴게를 종료 하시겠어요?"}
    buttons={[{ label: "취소", onClick: onCancel, variant: "cancel" }, { label: "확인", onClick: onConfirm }]}
  />
);

export default BreakConfirmDialog;
