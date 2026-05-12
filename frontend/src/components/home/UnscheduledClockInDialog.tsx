import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface UnscheduledClockInDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UnscheduledClockInDialog = ({ open, onConfirm, onCancel }: UnscheduledClockInDialogProps) => (
  <ConfirmDialog
    open={open} onOpenChange={(v) => { if (!v) onCancel(); }}
    title="무일정 출근하기"
    description={<>등록된 일정이 없어요<br />무일정 출근을 하시겠어요?</>}
    buttons={[{ label: "취소", onClick: onCancel, variant: "cancel" }, { label: "확인", onClick: onConfirm }]}
  />
);

export default UnscheduledClockInDialog;
