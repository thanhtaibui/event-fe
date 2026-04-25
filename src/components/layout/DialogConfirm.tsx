import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import "../../styles/layout/popup.css";
type Props = {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ open, onConfirm, onClose }: Props) {
  return (
    <div className="dialog">
      <Dialog open={open} onClose={onClose} className="confirm-dialog">
        <DialogTitle>Confirm</DialogTitle>

        <DialogContent>Are you sure?</DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>

          <Button color="error" onClick={onConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
