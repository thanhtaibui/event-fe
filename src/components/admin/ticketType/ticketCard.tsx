import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { useTicketTypeByIdEvent } from "../../../hooks/admin/event/useTicketTypes";
import { CreateTT } from "./createTT";
import { UpdateTT } from "./updateTT";

interface TicketCardProps {
  id: string;
  canManage?: boolean;
}
export const TicketCard: React.FC<TicketCardProps> = ({ id, canManage = true }) => {
  const [ticketId, setTicketId] = useState<string>("");
  const { data: ticketTypes, refetch: refTicketType } =
    useTicketTypeByIdEvent(id);
  const [showPopup, setShowPopup] = useState<"createTT" | "updateTT" | null>();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };
  return (
    <div className="tickets-card" style={{ position: "relative" }}>
      {showPopup === "createTT" && (
        <CreateTT
          id={id || ""}
          onClose={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
            refTicketType();
          }}
        />
      )}
      {showPopup === "updateTT" && (
        <UpdateTT
          id={ticketId || ""}
          eventId={id || ""}
          onClose={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
            refTicketType();
          }}
        />
      )}
      <div className="tickets-title">
        <h3>Ticket Types</h3>
        {canManage && (
          <button onClick={() => setShowPopup("createTT")}>Add Tier +</button>
        )}
      </div>
      {ticketTypes && ticketTypes.length > 0 ? (
        ticketTypes.map((ticketType: any) => {
          const totalQty = ticketType.total_quantity || ticketType.totalQuantity || ticketType.quantity || 1;
          const percentage = (ticketType.quantity / totalQty) * 100;

          let statusStyle: React.CSSProperties = {
            color: "#2fc96a",
          };
          if (ticketType.quantity <= 0) {
            statusStyle = {
              color: "#acacac",
            };
          } else if (percentage <= 15) {
            statusStyle = {
              color: "#ef4444",
            };
          } else if (percentage <= 50) {
            statusStyle = {
              color: "#f59e0b",
            };
          }

          return (
            <div
              key={ticketType.id}
              className="ticket-item"
              style={{
                cursor: canManage ? "pointer" : "default",
              }}
              onDoubleClick={() => {
                if (canManage) {
                  setTicketId(ticketType.id);
                  setShowPopup("updateTT");
                }
              }}
            >
              <div className="ticket-info">
                <h5 className="ticket-item__name">{ticketType.name}</h5>
                <span
                  className={`ticket-status`}
                  style={statusStyle ? { ...statusStyle } : {}}
                >
                  {ticketType.quantity > 0
                    ? `Only ${new Intl.NumberFormat("vi-VN").format(ticketType.quantity)} left`
                    : "Sold Out"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="ticket-price">
                  {formatPrice(ticketType.price)}{" "}
                  <span className="currency">VND</span>
                </div>
                {canManage && (
                  <button
                    type="button"
                    title="Edit ticket tier"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTicketId(ticketType.id);
                      setShowPopup("updateTT");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "#64748b",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      transition: "color 0.15s ease, background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#7c3aed";
                      e.currentTarget.style.background = "#f5f3ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#64748b";
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="ticket-empty">
          <div className="img-tier">
            <img
              width="32"
              height="32"
              src="https://img.icons8.com/windows/32/ticket.png"
              alt="ticket"
            />
          </div>
          <h3 className="empty__title">No Ticket Types Yet</h3>
          <p className="empty__description">
            Create your first ticket tier to start selling
          </p>
          {canManage && (
            <button
              className="btn-tier"
              onClick={() => {
                setShowPopup("createTT");
              }}
            >
              + Create Ticket Tier
            </button>
          )}
        </div>
      )}
    </div>
  );
};
