import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type BookingCartTicket = {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
  totalQuantity?: number;
  total_quantity?: number;
  description?: string | null;
};

export type BookingCartEvent = {
  id: string;
  encodedId?: string;
  title: string;
  place?: string;
  startDateTime?: string | Date;
  eventBanner?: string;
  organizationName?: string;
};

export type BookingCartItem = {
  event: BookingCartEvent;
  ticket: BookingCartTicket;
  quantity: number;
};

type BookingCartContextValue = {
  items: BookingCartItem[];
  isCartOpen: boolean;
  totalQuantity: number;
  totalPrice: number;
  addTicket: (
    event: BookingCartEvent,
    ticket: BookingCartTicket,
    quantity: number,
  ) => void;
  setTicketQuantity: (
    eventId: string,
    ticketId: string,
    quantity: number,
  ) => void;
  removeTicket: (eventId: string, ticketId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getItemQuantity: (eventId: string, ticketId: string) => number;
  getItemsForEvent: (eventId: string) => BookingCartItem[];
};

const BookingCartContext = createContext<BookingCartContextValue | null>(null);

const CART_STORAGE_KEY = "eventix_booking_cart";

function loadSavedCart(): BookingCartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function isEventMatching(itemEvent: BookingCartEvent, targetEventId: string) {
  const target = String(targetEventId || "");
  if (!target) return false;
  return (
    String(itemEvent.id) === target ||
    Boolean(itemEvent.encodedId && String(itemEvent.encodedId) === target)
  );
}

function isTicketMatching(itemTicket: BookingCartTicket, targetTicketId: string) {
  return String(itemTicket.id) === String(targetTicketId || "");
}

function isItemMatching(item: BookingCartItem, eventId: string, ticketId: string) {
  return isEventMatching(item.event, eventId) && isTicketMatching(item.ticket, ticketId);
}

function getTicketRemaining(ticket: BookingCartTicket) {
  return Math.max(Number(ticket.quantity ?? 0), 0);
}

export function formatBookingPrice(value?: number) {
  const price = Number(value ?? 0);
  if (price <= 0) return "Free";

  return `${new Intl.NumberFormat("vi-VN").format(price)} đ`;
}

export function BookingCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BookingCartItem[]>(() => loadSavedCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage write errors
    }
  }, [items]);

  const value = useMemo<BookingCartContextValue>(() => {
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce(
      (total, item) => total + Number(item.ticket.price ?? 0) * item.quantity,
      0,
    );

    return {
      items,
      isCartOpen,
      totalQuantity,
      totalPrice,
      addTicket(event, ticket, quantity) {
        const remaining = getTicketRemaining(ticket);
        const safeQuantity = Math.min(Math.max(Number(quantity) || 0, 0), remaining);

        setItems((currentItems) => {
          if (safeQuantity <= 0) {
            return currentItems.filter(
              (item) => !isItemMatching(item, event.id, ticket.id),
            );
          }

          const existingIndex = currentItems.findIndex((item) =>
            isItemMatching(item, event.id, ticket.id),
          );

          if (existingIndex >= 0) {
            return currentItems.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    event: {
                      ...item.event,
                      ...event,
                    },
                    ticket: {
                      ...item.ticket,
                      ...ticket,
                    },
                    quantity: safeQuantity,
                  }
                : item,
            );
          }

          return [...currentItems, { event, ticket, quantity: safeQuantity }];
        });
      },
      setTicketQuantity(eventId, ticketId, quantity) {
        setItems((currentItems) =>
          currentItems
            .map((item) => {
              if (!isItemMatching(item, eventId, ticketId)) {
                return item;
              }

              const remaining = getTicketRemaining(item.ticket);
              return {
                ...item,
                quantity: Math.min(Math.max(Number(quantity) || 0, 0), remaining),
              };
            })
            .filter((item) => item.quantity > 0),
        );
      },
      removeTicket(eventId, ticketId) {
        setItems((currentItems) =>
          currentItems.filter((item) => !isItemMatching(item, eventId, ticketId)),
        );
      },
      clearCart() {
        setItems([]);
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
          // ignore
        }
      },
      openCart() {
        setIsCartOpen(true);
      },
      closeCart() {
        setIsCartOpen(false);
      },
      getItemQuantity(eventId, ticketId) {
        return (
          items.find((item) => isItemMatching(item, eventId, ticketId))?.quantity || 0
        );
      },
      getItemsForEvent(eventId) {
        return items.filter((item) => isEventMatching(item.event, eventId));
      },
    };
  }, [isCartOpen, items]);

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
}

export function useBookingCart() {
  const context = useContext(BookingCartContext);

  if (!context) {
    throw new Error("useBookingCart must be used within BookingCartProvider");
  }

  return context;
}
