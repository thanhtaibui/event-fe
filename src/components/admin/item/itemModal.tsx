import Item from "./item";
import ItemForm from "./itemForm";
import "../../../styles/popup/popup.css";

import "../../../styles/event/item.css";
import { useItems } from "../../../hooks/admin/item/useItems";
import { useState } from "react";
import arrowGif from "../../../../public/icons8-arrow.gif";

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
  type: _type,
  id,
}: ItemModalProps) {
  if (!isOpen) return null;

  const { data: items, fetchItems } = useItems(id);

  const [formType, setFormType] = useState<"create" | "update">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refetchKey] = useState(0);

  const handleSelectItem = (item: any) => {
    setSelectedItem({ ...item });
    setFormType("update");
  };

  const handleCreateMode = () => {
    setSelectedItem(null);
    setFormType("create");
  };
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

        <div className={`item-modal `}>
          <div className="item-modal__left">
            <Item
              items={items}
              fetchItems={fetchItems}
              onSelectItem={handleSelectItem}
              selectedItemId={selectedItem?.id}
            />
          </div>
          <div className={`transfer-indicator`}>
            <span
              className={`transfer-indicator__arrow ${
                formType === "create"
                  ? "transfer-indicator__arrow--left"
                  : "transfer-indicator__arrow--right"
              }`}
            >
              <img src={arrowGif} alt="arrowGif" />
            </span>
            {/* <span className="transfer-indicator__arrow">‹</span> */}
          </div>
          <div className="item-modal__right">
            <ItemForm
              key={refetchKey}
              type={formType}
              item={selectedItem}
              onSuccess={() => {
                fetchItems();
                handleCreateMode();
              }}
              id={id}
              onCreateMode={handleCreateMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
