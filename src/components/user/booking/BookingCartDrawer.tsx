import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  formatBookingPrice,
  useBookingCart,
} from "../../../contexts/BookingCartContext";

function getTicketAccentClass(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("vip")) return "booking-cart__item--vip";
  if (lower.includes("early")) return "booking-cart__item--early";
  return "booking-cart__item--standard";
}

export default function BookingCartDrawer() {
  const navigate = useNavigate();
  const {
    closeCart,
    isCartOpen,
    items,
    setTicketQuantity,
    totalPrice,
    totalQuantity,
  } = useBookingCart();

  const handleReviewBooking = () => {
    const firstItem = items[0];
    if (!firstItem) return;

    closeCart();
    navigate(`/app/events/${firstItem.event.encodedId || firstItem.event.id}/review`);
  };

  if (!isCartOpen) {
    return null;
  }

  return (
    <div
      className={`booking-cart ${isCartOpen ? "booking-cart--open" : ""}`}
      aria-hidden={!isCartOpen}
    >
      <button
        type="button"
        className="booking-cart__overlay"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <aside className="booking-cart__drawer" aria-label="Your Cart">
        <header className="booking-cart__header">
          <div className="booking-cart__headerText">
            <div className="booking-cart__titleRow">
              <h2>Your Cart</h2>
              <span className="booking-cart__badgeCount">
                {totalQuantity} {totalQuantity === 1 ? "ticket" : "tickets"} selected
              </span>
            </div>
          </div>
          <button
            type="button"
            className="booking-cart__close"
            aria-label="Close cart"
            onClick={closeCart}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="booking-cart__body">
          {items.length === 0 ? (
            <div className="booking-cart__empty">
              <span>
                <ShoppingCart size={24} aria-hidden="true" />
              </span>
              <strong>Your cart is empty</strong>
              <p>Add tickets from an event detail page to review them here.</p>
            </div>
          ) : (
            items.map((item) => {
              const remaining = Math.max(Number(item.ticket.quantity ?? 0), 0);
              const lineTotal = Number(item.ticket.price ?? 0) * item.quantity;
              const accentClass = getTicketAccentClass(item.ticket.name);

              return (
                <article
                  className={`booking-cart__item ${accentClass}`}
                  key={`${item.event.id}-${item.ticket.id}`}
                >
                  <div className="booking-cart__itemRow1">
                    <div className="booking-cart__itemTitles">
                      <span className="booking-cart__eventName">
                        {item.event.title}
                      </span>
                      <strong className="booking-cart__ticketName">
                        {item.ticket.name}
                      </strong>
                    </div>

                    <div
                      className="booking-cart__stepper"
                      aria-label="Quantity control"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setTicketQuantity(
                            item.event.id,
                            item.ticket.id,
                            item.quantity - 1,
                          )
                        }
                        aria-label={`Decrease ${item.ticket.name}`}
                      >
                        <Minus size={13} aria-hidden="true" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTicketQuantity(
                            item.event.id,
                            item.ticket.id,
                            item.quantity + 1,
                          )
                        }
                        disabled={remaining > 0 && item.quantity >= remaining}
                        aria-label={`Increase ${item.ticket.name}`}
                      >
                        <Plus size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="booking-cart__itemRow2">
                    <span className="booking-cart__ticketPrice">
                      {formatBookingPrice(item.ticket.price)}
                    </span>

                    <div className="booking-cart__itemRow2Right">
                      <strong className="booking-cart__subtotalValue">
                        {formatBookingPrice(lineTotal)}
                      </strong>
                      <button
                        type="button"
                        className="booking-cart__removeIconBtn"
                        onClick={() =>
                          setTicketQuantity(item.event.id, item.ticket.id, 0)
                        }
                        aria-label={`Remove ${item.ticket.name}`}
                        title="Remove ticket"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="booking-cart__footer">
          <div className="booking-cart__summaryRows">
            <div className="booking-cart__summarySubtotal">
              <span>Subtotal</span>
              <span>{formatBookingPrice(totalPrice)}</span>
            </div>
            <div className="booking-cart__summaryTotal">
              <span>Total</span>
              <strong>{formatBookingPrice(totalPrice)}</strong>
            </div>
          </div>
          <button
            type="button"
            className="booking-cart__review"
            disabled={totalQuantity <= 0}
            onClick={handleReviewBooking}
          >
            Review booking
          </button>
        </footer>
      </aside>
    </div>
  );
}
