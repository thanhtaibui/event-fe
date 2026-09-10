import { Dialog, DialogTitle, DialogActions } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import "../../../styles/admin/popup/confirm.css";
type Props = {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  onConfirm,
  onClose,
  loading = false,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isBusy = loading || submitting;

  useEffect(() => {
    if (!open) {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (isBusy || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog" onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} className="confirm-dialog" onClose={isBusy ? undefined : onClose}>
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
          <button className="btn-confirm" onClick={handleConfirm} disabled={isBusy}>
            {isBusy ? "Processing..." : "Confirm"}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
        </DialogActions>

        <div className="confirm-dialog-safety">Safety check active</div>
      </Dialog>
    </div>
  );
}
