import React, { useState } from "react";
import { useTicketTypeByIdEvent } from "../../hooks/admin/event/useTicketTypes";
import { CreateTT } from "./createTT";
import { UpdateTT } from "./updateTT";
import { Cursor3D } from "../layout/Cursor3D";

interface TicketCardProps {
  id: string;
}
export const TicketCard: React.FC<TicketCardProps> = ({ id }) => {
  const [ticketId, setTicketId] = useState<string>("");
  const { data: ticketTypes, refetch: refTicketType } =
    useTicketTypeByIdEvent(id);
  const [showPopup, setShowPopup] = useState<"createTT" | "updateTT" | null>();
  const [cursorHover, setCursorHover] = useState(false);
  const [cursorPress, setCursorPress] = useState(false);
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
      <Cursor3D show={cursorHover} press={cursorPress} />

      <div className="tickets-title">
        <h3>Ticket Types</h3>
        <button onClick={() => setShowPopup("createTT")}>Add Tier +</button>
      </div>
      {ticketTypes && ticketTypes.length > 0 ? (
        ticketTypes.map((ticketType: any) => {
          const percentage =
            (ticketType.quantity / ticketType.total_quantity) * 100;

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
                cursor: `url('https://img.icons8.com/external-basicons-solid-edtgraphics/24/external-Touch-gesture-touch-gestures-basicons-solid-edtgraphics-16.png'), auto`,
              }}
              onDoubleClick={() => {
                setTicketId(ticketType.id);
                setShowPopup("updateTT");
              }}
              onPointerEnter={() => setCursorHover(true)}
              onPointerLeave={() => {
                setCursorPress(false);
                setCursorHover(false);
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                setCursorPress(true);
              }}
              onPointerUp={() => {
                // Giữ hover SVG lại ngay cả sau khi thả chuột (không tắt cursorHover)
                setCursorPress(false);
              }}
              onPointerCancel={() => setCursorPress(false)}
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
              <div className="ticket-price">
                {formatPrice(ticketType.price)}{" "}
                <span className="currency">VND</span>
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
          <button
            className="btn-tier"
            onClick={() => {
              setShowPopup("createTT");
            }}
          >
            + Create Ticket Tier
          </button>
        </div>
      )}
    </div>
  );
};
