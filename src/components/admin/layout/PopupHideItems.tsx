import React from "react";

interface PopupHideItemsProps {
  title: string;
  count: number;
  show: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const PopupHideItems: React.FC<PopupHideItemsProps> = ({
  title,
  show,
  count,
  onConfirm,
  onClose,
}) => {
  return (
    <div className={`evt-del-attach ${show ? "is-open" : "is-closing"}`}>
      <div className="evt-del-box">
        <div className="evt-del-text">
          <img
            width="20"
            height="20"
            src="https://img.icons8.com/nolan/64/waste.png"
            alt="waste"
          />
          <strong>
            {title} {count} items?
          </strong>
          <p>This cannot be undone.</p>
        </div>

        <div className="evt-del-btns">
          <button className="evt-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="evt-btn-confirm" onClick={onConfirm}>
            {title}
          </button>
        </div>
      </div>
    </div>
  );
};
