import { Dialog, DialogTitle, DialogActions } from "@mui/material";
import "../../styles/popup/confirm.css";
type Props = {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ open, onConfirm, onClose }: Props) {
  return (
    <div className="dialog" onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} className="confirm-dialog">
        <div className="confirm-dialog-icon">
          <img
            width="30"
            height="30"
            src="https://img.icons8.com/nolan/64/high-priority.png"
            alt="high-priority"
          />
        </div>

        <DialogTitle>Are you sure you want to continue?</DialogTitle>

        <DialogActions>
          <button className="btn-confirm" onClick={onConfirm}>
            Confirm
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </DialogActions>

        <div className="confirm-dialog-safety">Safety check active</div>
      </Dialog>
    </div>
  );
}
