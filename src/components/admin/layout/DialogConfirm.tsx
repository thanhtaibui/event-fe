import { Dialog, DialogTitle, DialogActions } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import "../../../styles/admin/popup/confirm.css";
type Props = {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

function getAdminPopupThemeClass() {
  if (typeof window === "undefined") return "admin-popup-theme--light";
  return localStorage.getItem("eventix-theme") === "dark"
    ? "admin-popup-theme--dark"
    : "admin-popup-theme--light";
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onClose,
  loading = false,
  title = "Are you sure you want to continue?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const isBusy = loading || submitting;
  const popupThemeClass = getAdminPopupThemeClass();

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
      <Dialog
        open={open}
        className={`confirm-dialog ${popupThemeClass}`}
        onClose={isBusy ? undefined : onClose}
      >
        <div className="confirm-dialog-icon">
          <img
            width="30"
            height="30"
            src="https://img.icons8.com/nolan/64/high-priority.png"
            alt="high-priority"
          />
        </div>

        <DialogTitle>{title}</DialogTitle>
        {message && (
          <div className="MuiDialogContent-root confirm-dialog-message">
            {message}
          </div>
        )}

        <DialogActions>
          <button className="btn-confirm" onClick={handleConfirm} disabled={isBusy}>
            {isBusy ? "Processing..." : confirmLabel}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={isBusy}>
            {cancelLabel}
          </button>
        </DialogActions>

        <div className="confirm-dialog-safety">Safety check active</div>
      </Dialog>
    </div>
  );
}
