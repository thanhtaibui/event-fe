import React, { useState } from "react";
import { createPortal } from "react-dom";
import "../../../styles/admin/popup/popup.css";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { useCreateTicketType } from "../../../hooks/admin/ticketType/useCreateTicketType";
import { toast } from "react-toastify";
interface CreateTTProps {
  id: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const CreateTT: React.FC<CreateTTProps> = ({
  id,
  onSuccess,
  onClose,
}) => {
  const { createTicketType } = useCreateTicketType();
  const [uiLoading, setUiLoading] = useState(false);
  const [form, setForm] = useState<Partial<TicketType>>({
    name: "",
    price: 0,
    quantity: 0,
    eventId: id,
  });
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };
  const parseNumber = (val: string) => {
    return Number(val.replace(/\./g, ""));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Loại bỏ mọi ký tự không phải số
    const rawValue = value.replace(/\D/g, "");
    // Lưu vào state là kiểu NUMBER để DB/NestJS đọc được
    setForm({ ...form, [name]: Number(rawValue) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uiLoading) return;

    if (!form.name?.trim()) {
      toast.warning("Vui lòng nhập tên loại vé.");
      return;
    }

    const price = parseNumber(form.price?.toString() || "0");
    if (isNaN(price) || price < 0) {
      toast.warning("Giá vé không hợp lệ.");
      return;
    }

    const quantity = Number(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.warning("Số lượng vé phải lớn hơn 0.");
      return;
    }

    try {
      setUiLoading(true);
      const payload = {
        ...form,
        name: form.name.trim(),
        price,
        quantity,
        eventId: id,
      } as TicketType;
      await createTicketType(payload);
      toast.success("Tạo loại vé thành công!");
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Create ticket type error:", error);
      const backendMessage = error?.response?.data?.message || error?.message;
      const message = Array.isArray(backendMessage)
        ? backendMessage[0]
        : backendMessage || "Không thể tạo loại vé. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setUiLoading(false);
    }
  };
  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box-mini" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios-glyphs/30/add-ticket--v1.png"
                alt="add-ticket--v1"
              />
            </div>
            <h2>Create Ticket Tier</h2>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          id="popup-form-mini"
          className="popup-form-mini"
          onSubmit={handleSubmit}
        >
          {/* 4 Input tương ứng với: Name, Price, Quantity, Description */}
          <div className="form-group full-width">
            <label className="required">Tier Name</label>
            <input
              name="name"
              placeholder="e.g. VIP Lounge"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group full-width">
            <label className="required">Price (VND)</label>
            <input
              type="text"
              name="price"
              placeholder="price in VND"
              value={form.price === 0 ? "" : formatPrice(form.price || 0)}
              onChange={handleChangePrice}
            />
          </div>
          <div className="form-group full-width">
            <label className="required">Quantity</label>
            <input
              type="number"
              name="quantity"
              placeholder="100"
              value={form.quantity}
              onChange={handleChange}
            />
          </div>
        </form>
        <div className="popup-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="popup-form-mini" disabled={uiLoading}>
            {uiLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
