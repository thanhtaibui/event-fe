import Item from "./item";
import ItemForm from "./itemForm";
import "../../styles/popup/popup.css";

import "../../styles/event/item.css";
import { useItems } from "../../hooks/admin/item/useItems";

export type ItemModalType = "create" | "update";

export type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: ItemModalType;
  id: string;
};

export default function ItemModal({
  isOpen,
  onClose,
  type,
  id,
}: ItemModalProps) {
  if (!isOpen) return null;
  const { data: items, fetchItems } = useItems(id);

  return (
    <div className="item-modal-overlay" onClick={onClose}>
      <div
        className="item-modal-shell"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="item-modal-header">
          {/* <div className="item-modal-title">{title}</div> */}
          <button
            type="button"
            className="item-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="item-modal">
          <div className="item-modal__left">
            <Item items={items} fetchItems={fetchItems} />{" "}
          </div>
          <div className="item-modal__right">
            <ItemForm type={type} id={id} onSuccess={fetchItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
