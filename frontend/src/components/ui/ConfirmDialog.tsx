import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ButtonConfig {
  label: string;
  onClick: () => void;
  variant?: "cancel" | "confirm" | "danger";
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  buttons: ButtonConfig[];
}

const btnStyle = (variant: ButtonConfig["variant"] = "confirm"): React.CSSProperties => ({
  height: '52px',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  flex: 1,
  ...(variant === "cancel"
    ? { backgroundColor: '#EBEBEB', color: '#70737B' }
    : variant === "danger"
    ? { backgroundColor: '#FF5959', color: '#FFFFFF' }
    : { backgroundColor: '#4261FF', color: '#FFFFFF' }),
});

const ConfirmDialog = ({ open, onOpenChange, title, description, buttons }: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="[&>button]:hidden p-0 overflow-hidden border-none"
      style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }}>
        <DialogTitle style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', lineHeight: '1.5', textAlign: 'center', marginBottom: '20px' }}>
            {description}
          </DialogDescription>
        )}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {buttons.map((btn, i) => (
            <button key={i} onClick={btn.onClick} style={btnStyle(btn.variant)}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
