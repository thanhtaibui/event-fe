import React, { useEffect, useState } from "react";
import "../../styles/layout/popup.css";
import type { TicketType } from "../../types/ticket-type/ticket-type";
import { toast } from "react-toastify";
import { useTicketTypeById } from "../../hooks/admin/ticketType/useTicketTypeById";
import { useUpdateTicketType } from "../../hooks/admin/ticketType/useUpdateTicketType";
interface UpdateTTProps {
  id: string;
  eventId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const UpdateTT: React.FC<UpdateTTProps> = ({
  id,
  eventId,
  onSuccess,
  onClose,
}) => {
  const { updateTicketType } = useUpdateTicketType();
  const [uiLoading, setUiLoading] = useState(false);
  const { data: ticketType } = useTicketTypeById(id);
  const [form, setForm] = useState<Partial<TicketType>>({
    name: "",
    price: 0,
    quantity: 0,
    eventId: eventId,
  });

  useEffect(() => {
    if (ticketType) {
      setForm({
        name: ticketType.name,
        price: ticketType.price,
        quantity: ticketType.quantity,
        eventId: eventId,
      });
    }
  }, [ticketType, eventId]);
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
    try {
      form.price = parseNumber(form.price?.toString() || "0");
      form.quantity = Number(form.quantity);
      // console.log("Submitting form:", form);
      const res = await updateTicketType(id, form as TicketType);
      if (res) {
        toast.success("Ticket Tier updated successfully!");
        await onSuccess();
        setUiLoading(false);
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
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
            <h2>Update Ticket Tier</h2>
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
            {uiLoading ? "Save Changes..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
