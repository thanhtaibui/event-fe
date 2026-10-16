import {
  ArrowLeft,
  Building,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

import {
  formatBookingPrice,
  useBookingCart,
} from "../../contexts/BookingCartContext";
import { createOrder, type CreateOrderPayload } from "../../services/order.service";
import { useInfo } from "../../hooks/layout/useInfo";
import { getAccessToken } from "../../constants/authStorage";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";

import "../../styles/user/event/eventDetail.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const userInfo = useInfo();
  const { items, totalPrice, totalQuantity, clearCart } = useBookingCart();
  const firstEvent = items[0]?.event;

  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "wallet">(
    "card",
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setForm((prev) => ({
        fullName: prev.fullName || userInfo.fullName || "",
        email: prev.email || userInfo.email || "",
        phone: prev.phone || userInfo.phoneNumber || "",
      }));
    }
  }, [userInfo]);

  const handlePayNow = async () => {
    if (isSubmitting) return;

    const token = getAccessToken();
    let currentUserId = userInfo?.id;
    if (!currentUserId && token) {
      try {
        const decoded = jwtDecode<JwtPayloadCustom>(token);
        currentUserId = decoded.sub;
      } catch {
        // ignore decoding errors
      }
    }

    if (!currentUserId) {
      toast.error("Please login to proceed with your booking payment.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!items.length) {
      toast.error("Your checkout is empty. Please select tickets first.");
      return;
    }

    const payload: CreateOrderPayload = {
      userId: currentUserId,
      items: items.map((item) => ({
        ticketTypeId: item.ticket.id,
        quantity: item.quantity,
      })),
    };

    console.log("[CheckoutPage] Request payload:", payload);

    try {
      setIsSubmitting(true);
      const response = await createOrder(payload);
      console.log("[CheckoutPage] API response:", response);

      const orderData = response?.data || response;
      try {
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
      } catch {
        // ignore sessionStorage errors
      }

      clearCart();
      toast.success("Order created successfully!");
      navigate("/app/tickets", { state: { order: orderData, success: true } });
    } catch (error: any) {
      console.error("[CheckoutPage] API error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create order. Please check your tickets and try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <main className="checkout-page checkout-page--empty">
        <section className="checkout-page__emptyCard">
          <span className="checkout-page__emptyIcon">
            <Ticket size={28} aria-hidden="true" />
          </span>
          <span className="checkout-page__eyebrow">CHECKOUT</span>
          <h1>Your checkout is empty</h1>
          <p>Please select tickets from an event before proceeding to payment.</p>
          <Link className="checkout-page__emptyAction" to="/app/events">
            Browse events
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-page__container">
        {/* TOP NAVIGATION & STEPPER */}
        <div className="checkout-page__topHeader">
          <button
            type="button"
            className="checkout-page__back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to review</span>
          </button>

          {/* PAYMENT STEP INDICATOR */}
          <div className="checkout-stepper" aria-label="Checkout Progress">
            <div className="checkout-stepper__step checkout-stepper__step--completed">
              <span className="checkout-stepper__circle">
                <CheckCircle2 size={15} aria-hidden="true" />
              </span>
              <span className="checkout-stepper__label">1. Review booking</span>
            </div>

            <div className="checkout-stepper__line checkout-stepper__line--active" />

            <div className="checkout-stepper__step checkout-stepper__step--active">
              <span className="checkout-stepper__circle">2</span>
              <span className="checkout-stepper__label">2. Payment</span>
            </div>

            <div className="checkout-stepper__line" />

            <div className="checkout-stepper__step">
              <span className="checkout-stepper__circle">3</span>
              <span className="checkout-stepper__label">3. Confirmation</span>
            </div>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT (65% / 35%) */}
        <div className="checkout-page__layout">
          {/* LEFT CONTENT (65%) */}
          <div className="checkout-page__main">
            {/* 1. PAYMENT INFORMATION CARD */}
            <section className="checkout-page__card checkout-page__paymentCard">
              <div className="checkout-page__cardHeader">
                <span className="checkout-page__eyebrow">PAYMENT DETAILS</span>
                <h2>Payment information</h2>
                <p>
                  Enter your contact details and choose your preferred payment
                  method.
                </p>
              </div>

              {/* CONTACT FORM */}
              <div className="checkout-page__formGrid">
                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-fullname">
                    <User size={15} aria-hidden="true" />
                    <span>Full name</span>
                  </label>
                  <input
                    id="checkout-fullname"
                    type="text"
                    placeholder="e.g. Nguyen Van A"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                  />
                </div>

                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-email">
                    <Mail size={15} aria-hidden="true" />
                    <span>Email address</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-phone">
                    <Phone size={15} aria-hidden="true" />
                    <span>Phone number</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    placeholder="e.g. +84 987 654 321"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="checkout-page__methodsSection">
                <span className="checkout-page__methodsTitle">
                  Select payment method
                </span>

                <div className="checkout-page__methodsList">
                  {/* Option 1: Card */}
                  <label
                    className={`checkout-method ${
                      paymentMethod === "card" ? "checkout-method--active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span className="checkout-method__icon">
                      <CreditCard size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <strong>Card payment</strong>
                      <small>Credit / Debit cards (Visa, Mastercard, JCB)</small>
                    </div>
                  </label>

                  {/* Option 2: Bank transfer */}
                  <label
                    className={`checkout-method ${
                      paymentMethod === "bank" ? "checkout-method--active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                    />
                    <span className="checkout-method__icon">
                      <Building size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <strong>Bank transfer</strong>
                      <small>VietQR instant payment via any mobile banking app</small>
                    </div>
                  </label>

                  {/* Option 3: E-wallet */}
                  <label
                    className={`checkout-method ${
                      paymentMethod === "wallet" ? "checkout-method--active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                    />
                    <span className="checkout-method__icon">
                      <Wallet size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <strong>E-wallet</strong>
                      <small>MoMo, ZaloPay, ShopeePay, VNPay QR</small>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* 2. BILLING SUMMARY */}
            <section className="checkout-page__card checkout-page__billingCard">
              <div className="checkout-page__cardHeader">
                <span className="checkout-page__eyebrow">ORDER DETAILS</span>
                <h2>Billing summary</h2>
                <strong className="checkout-page__eventName">
                  {firstEvent?.title || "Selected Event"}
                </strong>
              </div>

              <div
                className="checkout-page__ticketItems"
                aria-label="Billing tickets"
              >
                {items.map((item) => {
                  const lineTotal =
                    Number(item.ticket.price ?? 0) * item.quantity;

                  return (
                    <article
                      className="checkout-billing-item"
                      key={`${item.event.id}-${item.ticket.id}`}
                    >
                      <div className="checkout-billing-item__info">
                        <strong>{item.ticket.name}</strong>
                        <span>
                          {formatBookingPrice(item.ticket.price)} x{" "}
                          {item.quantity}
                        </span>
                      </div>
                      <strong className="checkout-billing-item__total">
                        {formatBookingPrice(lineTotal)}
                      </strong>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR (35%) - ORDER SUMMARY */}
          <aside className="checkout-page__sidebar">
            <div className="checkout-page__card checkout-page__summaryCard">
              <span className="checkout-page__eyebrow">CHECKOUT SUMMARY</span>
              <h2>Order summary</h2>

              <div className="checkout-page__summaryList">
                <div className="checkout-page__summaryRow">
                  <span>
                    Ticket subtotal ({totalQuantity}{" "}
                    {totalQuantity === 1 ? "ticket" : "tickets"})
                  </span>
                  <strong>{formatBookingPrice(totalPrice)}</strong>
                </div>

                <div className="checkout-page__summaryRow">
                  <span>Fees</span>
                  <span className="checkout-page__feesFree">0 đ</span>
                </div>

                <div className="checkout-page__summaryDivider" />

                <div className="checkout-page__totalRow">
                  <div>
                    <span>Total payment</span>
                    <small>Including all service charges & taxes</small>
                  </div>
                  <strong>{formatBookingPrice(totalPrice)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="checkout-page__payBtn"
                disabled={isSubmitting}
                onClick={handlePayNow}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    <span>Processing order...</span>
                  </>
                ) : (
                  <>
                    <span>Pay now</span>
                    <span className="checkout-page__payBtnAmount">
                      • {formatBookingPrice(totalPrice)}
                    </span>
                  </>
                )}
              </button>

              <div className="checkout-page__securityBox">
                <div className="checkout-page__securityItem">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>256-bit SSL encrypted & secure checkout</span>
                </div>
                <div className="checkout-page__securityItem">
                  <Lock size={16} aria-hidden="true" />
                  <span>Instant e-ticket delivery to email</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
