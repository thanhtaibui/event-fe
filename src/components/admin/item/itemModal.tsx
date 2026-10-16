import Item from "./item";
import ItemForm from "./itemForm";
import "../../../styles/admin/popup/popup.css";

import "../../../styles/event/item.css";
import { useItems } from "../../../hooks/admin/item/useItems";
import { useState } from "react";

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
  const { data: items, fetchItems } = useItems(id);

  const [formType, setFormType] = useState<"create" | "update">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  if (!isOpen) return null;

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
          <div className="item-modal-title-wrap">
            <span className="item-modal-title-icon" aria-hidden="true">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/ios-filled/50/box.png"
                alt=""
              />
            </span>
            <div className="item-modal-title">
              <span>Event items</span>
              <strong>Item management</strong>
            </div>
          </div>
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
            <Item
              items={items}
              fetchItems={fetchItems}
              onSelectItem={handleSelectItem}
              selectedItemId={selectedItem?.id}
            />
          </div>
          <div className="item-modal__right">
            <ItemForm
              key={`${formType}-${selectedItem?.id || "new"}`}
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
