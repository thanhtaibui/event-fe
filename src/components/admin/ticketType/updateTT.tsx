import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../../styles/admin/popup/popup.css";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { toast } from "react-toastify";
import { useTicketTypeById } from "../../../hooks/admin/ticketType/useTicketTypeById";
import { useUpdateTicketType } from "../../../hooks/admin/ticketType/useUpdateTicketType";
import { AdminModalError, AdminModalLoading } from "../layout/AdminModalState";

const UPDATE_TICKET_TYPE_FORM_ID = "update-ticket-type-form";

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
  const { data: ticketType, loading, error, refetch } = useTicketTypeById(id);
  const [detailReady, setDetailReady] = useState(false);
  const [form, setForm] = useState<Partial<TicketType>>({
    name: "",
    price: 0,
    quantity: 0,
    eventId: eventId,
  });

  useEffect(() => {
    setDetailReady(false);
    setForm({
      name: "",
      price: 0,
      quantity: 0,
      eventId: eventId,
    });
  }, [eventId, id]);

  useEffect(() => {
    if (ticketType) {
      setForm({
        name: ticketType.name,
        price: ticketType.price,
        quantity: ticketType.quantity,
        eventId: eventId,
      });
      setDetailReady(true);
    }
  }, [ticketType, eventId]);

  const isInitialLoading = loading || (!detailReady && !error);
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
        eventId: eventId,
      } as TicketType;
      await updateTicketType(id, payload);
      toast.success("Cập nhật loại vé thành công!");
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Update ticket type error:", error);
      const backendMessage = error?.response?.data?.message || error?.message;
      const message = Array.isArray(backendMessage)
        ? backendMessage[0]
        : backendMessage || "Không thể cập nhật loại vé. Vui lòng thử lại.";
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
            <h2>Update Ticket Tier</h2>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error ? (
          <AdminModalError minHeight={220} onRetry={refetch} />
        ) : isInitialLoading ? (
          <AdminModalLoading minHeight={220} />
        ) : (
        <form
          id={UPDATE_TICKET_TYPE_FORM_ID}
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
        )}
        {detailReady && !error && (
          <div className="popup-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form={UPDATE_TICKET_TYPE_FORM_ID} disabled={uiLoading}>
              {uiLoading ? "Save Changes..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
