import { useState } from "react";
import { useDeleteItem } from "../../hooks/admin/item/useDeleteItem";
import ConfirmDialog from "../layout/DialogConfirm";
import { toast } from "react-toastify";

export type ItemProps = {
  items: any;
  fetchItems: () => void;
};

export default function Item({ items, fetchItems }: ItemProps) {
  const { deleteItem } = useDeleteItem();
  const handleDelete = async (id: string) => {
    const success = await deleteItem(id);
    if (success) {
      toast.success("Delete item successfully");
      await fetchItems();
      setPopupType(null);
      setDeleteId(null);
    }
  };
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"delete" | null>(null);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };
  return (
    <section className="inventory-panel inventory-panel--list">
      <ConfirmDialog
        open={popupType === "delete"}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
        onClose={() => {
          setPopupType(null);
          setDeleteId(null);
        }}
      />
      <div className="inventory-panel__header">
        <h3 className="inventory-panel__title">Manage</h3>

        <button className="inventory-panel__search">
          <img
            width="24"
            height="24"
            src="https://img.icons8.com/nolan/64/search.png"
            alt="search"
          />
        </button>
      </div>

      <div className="inventory-table">
        <div className="inventory-table__header">
          <div className="inventory-table__item-col">Item</div>
          <div className="inventory-table__price-col">Price</div>
        </div>
        {items?.map((item: any) => (
          <div className="inventory-table__row" key={item.id}>
            <div className="inventory-table__item-col">
              <div className="inventory-item">
                <div className="inventory-item__image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>

                <div className="inventory-item__content">
                  <div className="inventory-item__name">{item?.name}</div>
                </div>
              </div>
            </div>

            <div className="inventory-table__price-col">
              {formatPrice(item.price)} VNĐ
            </div>
            <div className="icon-delete">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/nolan/64/cancel.png"
                alt="cancel"
                onClick={() => {
                  setDeleteId(item.id);
                  setPopupType("delete");
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="inventory-panel__footer">
        <button className="inventory-export-btn">Export CSV</button>
      </div>
    </section>
  );
}
