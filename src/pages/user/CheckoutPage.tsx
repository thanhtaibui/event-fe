import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

import {
  formatBookingPrice,
  useBookingCart,
} from "../../contexts/BookingCartContext";
import {
  createOrder,
  createVietQrPayment,
  extractOrdersFromResponse,
  getPaymentById,
  type CreateOrderPayload,
  type OrderResponse,
  type VietQrPaymentResponse,
} from "../../services/order.service";
import { useInfo } from "../../hooks/layout/useInfo";
import { getAccessToken } from "../../constants/authStorage";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";

import "../../styles/user/event/eventDetail.css";

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const userInfo = useInfo();
  const { items, totalPrice, totalQuantity, clearCart } = useBookingCart();
  const firstEvent = items[0]?.event;

  const [step, setStep] = useState<"payment" | "vietqr" | "confirmation">("payment");
  const [createdOrders, setCreatedOrders] = useState<OrderResponse[]>([]);
  const [payments, setPayments] = useState<VietQrPaymentResponse[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
  const [orderSnapshot, setOrderSnapshot] = useState<{
    eventTitle: string;
    totalPrice: number;
    totalQuantity: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  } | null>(null);

  const currentPayment = payments[activeOrderIndex] ?? payments[0] ?? null;

  // Bank transfer (VietQR) is currently the active available method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "wallet">(
    "bank",
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    phone?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Restore active orders and payment data from sessionStorage on mount (supports refresh/reload)
  useEffect(() => {
    try {
      const savedSnapshot = sessionStorage.getItem("eventix_order_snapshot");
      if (savedSnapshot) setOrderSnapshot(JSON.parse(savedSnapshot));

      // Restore orders (supporting both multi-order array and legacy single order)
      const savedOrders = sessionStorage.getItem("eventix_current_orders");
      const savedOrder = sessionStorage.getItem("eventix_current_order");
      let restoredOrders: OrderResponse[] = [];
      if (savedOrders) {
        restoredOrders = JSON.parse(savedOrders);
      } else if (savedOrder) {
        restoredOrders = [JSON.parse(savedOrder)];
      }
      if (restoredOrders.length) {
        setCreatedOrders(restoredOrders);
      }

      // Restore payments (supporting both multi-payment array and legacy single payment)
      const savedPayments = sessionStorage.getItem("eventix_active_payments");
      const savedPayment = sessionStorage.getItem("eventix_active_payment");
      let restoredPayments: VietQrPaymentResponse[] = [];
      if (savedPayments) {
        restoredPayments = JSON.parse(savedPayments);
      } else if (savedPayment) {
        restoredPayments = [JSON.parse(savedPayment)];
      }

      if (restoredPayments.length) {
        setPayments(restoredPayments);
        setStep("vietqr");

        // Validate current payment status with BE immediately
        Promise.all(
          restoredPayments.map(async (p) => {
            try {
              const res = await getPaymentById(p.paymentId);
              return { ...p, status: res.status };
            } catch {
              return p;
            }
          }),
        ).then((synced) => {
          setPayments(synced);
          const allPaid = synced.length > 0 && synced.every((p) => p.status === "PAID");
          if (allPaid) {
            setCreatedOrders((prev) => prev.map((o) => ({ ...o, status: "PAID" })));
            setStep("confirmation");
          }
        });
      }
    } catch (err) {
      console.warn("[CheckoutPage] Error restoring session storage:", err);
    }
  }, []);

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (userInfo) {
      setForm((prev) => ({
        fullName: prev.fullName || userInfo.fullName || "",
        email: prev.email || userInfo.email || "",
        phone: prev.phone || userInfo.phoneNumber || "",
      }));
    }
  }, [userInfo]);

  // Polling mechanism: Poll payment status from BE every 3.5s for all pending payments
  useEffect(() => {
    if (step !== "vietqr" || !payments.length) {
      return;
    }

    const hasPending = payments.some(
      (p) => p.status === "PENDING" || p.status === "UNDERPAID",
    );
    if (!hasPending) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        let anyChanged = false;
        const updated = await Promise.all(
          payments.map(async (p) => {
            if (p.status !== "PENDING" && p.status !== "UNDERPAID") {
              return p;
            }
            try {
              const res = await getPaymentById(p.paymentId);
              if (res.status !== p.status) {
                anyChanged = true;
                return { ...p, status: res.status };
              }
            } catch (err) {
              console.warn(`[Polling] Error checking payment status for ${p.paymentId}:`, err);
            }
            return p;
          }),
        );

        if (anyChanged) {
          setPayments(updated);
          try {
            sessionStorage.setItem("eventix_active_payments", JSON.stringify(updated));
          } catch {
            // ignore
          }

          const allPaid = updated.every((p) => p.status === "PAID");
          if (allPaid) {
            clearInterval(interval);
            setCreatedOrders((prev) => prev.map((o) => ({ ...o, status: "PAID" })));
            toast.success("All payments verified successfully!");
            setStep("confirmation");
          } else {
            const cur = updated[activeOrderIndex];
            if (cur && cur.status === "PAID" && payments[activeOrderIndex]?.status !== "PAID") {
              toast.success(`Payment for order #${cur.orderId.slice(0, 8)} verified!`);
            } else if (cur && cur.status === "EXPIRED" && payments[activeOrderIndex]?.status !== "EXPIRED") {
              toast.error("Payment session has expired.");
            }
          }
        }
      } catch (err) {
        console.warn("[Polling] General polling error:", err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [step, payments, activeOrderIndex]);

  // Countdown timer for current active VietQR payment
  useEffect(() => {
    if (step !== "vietqr" || !currentPayment?.expiresAt || currentPayment.status !== "PENDING") {
      setTimeLeft(null);
      return;
    }

    const expiryTime = new Date(currentPayment.expiresAt).getTime();
    const updateCountdown = () => {
      const remainingSeconds = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
      if (remainingSeconds <= 0 && currentPayment.status === "PENDING") {
        getPaymentById(currentPayment.paymentId)
          .then((res) => {
            setPayments((prev) =>
              prev.map((p) =>
                p.paymentId === currentPayment.paymentId ? { ...p, status: res.status } : p,
              ),
            );
          })
          .catch(() => {});
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [step, currentPayment?.expiresAt, currentPayment?.status, currentPayment?.paymentId]);

  const validateField = (field: keyof typeof form, value: string): string | undefined => {
    const trimmed = value.trim();
    if (field === "fullName") {
      if (!trimmed) return "Full name is required";
      if (trimmed.length < 2) return "Full name must be at least 2 characters";
    }
    if (field === "email") {
      if (!trimmed) return "Email address is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return "Please enter a valid email address";
    }
    if (field === "phone") {
      if (!trimmed) return "Phone number is required";
      const cleanPhone = trimmed.replace(/[\s-]/g, "");
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(cleanPhone)) return "Please enter a valid phone number (8-15 digits)";
    }
    return undefined;
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      fullName: validateField("fullName", form.fullName),
      email: validateField("email", form.email),
      phone: validateField("phone", form.phone),
    };

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, phone: true });

    return !newErrors.fullName && !newErrors.email && !newErrors.phone;
  };

  const handleBlur = (field: keyof typeof form) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSelectMethod = (method: "card" | "bank" | "wallet") => {
    if (method === "card") {
      toast.info(
        "Card payment gateway (Visa/Mastercard) is undergoing security review. Please select Bank transfer (VietQR) for now.",
      );
      return;
    }
    if (method === "wallet") {
      toast.info(
        "E-wallet gateway (MoMo/ZaloPay) is pending integration. Please select Bank transfer (VietQR) for now.",
      );
      return;
    }
    setPaymentMethod(method);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success(`Copied ${label} to clipboard!`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleCheckStatus = async () => {
    if (!payments.length || isCheckingStatus) return;
    setIsCheckingStatus(true);
    try {
      const updated = await Promise.all(
        payments.map(async (p) => {
          try {
            const res = await getPaymentById(p.paymentId);
            return { ...p, status: res.status };
          } catch {
            return p;
          }
        }),
      );

      setPayments(updated);
      try {
        sessionStorage.setItem("eventix_active_payments", JSON.stringify(updated));
      } catch {
        // ignore
      }

      const allPaid = updated.every((p) => p.status === "PAID");
      if (allPaid) {
        setCreatedOrders((prev) => prev.map((o) => ({ ...o, status: "PAID" })));
        toast.success("All payments verified successfully!");
        setStep("confirmation");
      } else {
        const active = updated[activeOrderIndex];
        if (active?.status === "PAID") {
          toast.success(`Order #${active.orderId.slice(0, 8)} is PAID!`);
        } else if (active?.status === "PENDING") {
          toast.info("Payment is still pending. We will automatically update when the bank transfer is confirmed.");
        } else if (active?.status === "EXPIRED") {
          toast.error("Payment session has expired.");
        } else {
          toast.warning(`Payment status: ${active?.status}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to check payment status. Please try again.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const formatTimeLeft = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePayNow = async () => {
    // Prevent double clicking / concurrent submissions
    if (isSubmittingRef.current || isSubmitting) return;

    // 1. Verify user authentication
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

    // 2. Validate cart items or existing orders
    if (!items.length && !createdOrders.length) {
      toast.error("Your checkout is empty. Please select tickets first.");
      return;
    }

    // 3. Validate mandatory contact information
    const isValid = validateAll();
    if (!isValid) {
      toast.warning("Please check your contact information and correct any errors.");
      return;
    }

    const snapshot = {
      eventTitle: firstEvent?.title || "Selected Event",
      totalPrice,
      totalQuantity,
      customerName: form.fullName.trim(),
      customerEmail: form.email.trim(),
      customerPhone: form.phone.trim(),
    };

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      let orderList: OrderResponse[] = createdOrders;

      // 4. Create Orders only if not already created previously
      if (!orderList.length) {
        const payload: CreateOrderPayload = {
          userId: currentUserId,
          items: items.map((item) => ({
            ticketTypeId: item.ticket.id,
            quantity: item.quantity,
          })),
        };

        console.log("[CheckoutPage] Creating order:", payload);
        const response = await createOrder(payload);
        orderList = extractOrdersFromResponse(response);

        if (!orderList.length) {
          throw new Error("Unable to obtain orders from server response");
        }

        setCreatedOrders(orderList);
        setOrderSnapshot(snapshot);

        try {
          sessionStorage.setItem("eventix_current_orders", JSON.stringify(orderList));
          sessionStorage.setItem("eventix_order_snapshot", JSON.stringify(snapshot));
        } catch {
          // ignore sessionStorage errors
        }
      }

      // 5. Initialize VietQR payment for each order
      console.log("[CheckoutPage] Initializing VietQR payments for orders:", orderList);
      const paymentResults: VietQrPaymentResponse[] = [];
      for (const order of orderList) {
        const targetOrderId = order.id || order.orderId;
        if (!targetOrderId) continue;
        const paymentRes = await createVietQrPayment(targetOrderId);
        paymentResults.push(paymentRes);
      }

      if (!paymentResults.length) {
        throw new Error("Unable to create VietQR payment for orders");
      }

      console.log("[CheckoutPage] VietQR payment responses:", paymentResults);
      setPayments(paymentResults);
      setActiveOrderIndex(0);

      try {
        sessionStorage.setItem("eventix_active_payments", JSON.stringify(paymentResults));
      } catch {
        // ignore sessionStorage errors
      }

      // 6. Safe to clear cart only AFTER orders are recorded and payments initialized
      clearCart();

      // 7. Advance stepper to VietQR screen
      setStep("vietqr");
      toast.success("Payment QR generated! Please scan to pay.");
    } catch (error: any) {
      console.error("[CheckoutPage] API error:", error);

      // Do NOT clear cart on failure to preserve selected tickets!
      let errorMessage = "Failed to proceed with payment. Please check your tickets and try again.";

      if (error?.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network and try again.";
      } else if (error?.message === "Network Error") {
        errorMessage = "Network error. Unable to reach payment server.";
      } else if (error?.response?.status === 400) {
        errorMessage =
          error?.response?.data?.message ||
          "Selected tickets are no longer available or organization payment account not configured.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Render empty cart state if not currently viewing confirmation or active payment
  if (!items.length && step === "payment" && !payments.length && !createdOrders.length) {
    return (
      <main className="checkout-page checkout-page--empty">
        <section className="checkout-page__emptyCard">
          <span className="checkout-page__emptyIcon">
            <Ticket size={28} aria-hidden="true" />
          </span>
          <h1>Your checkout is empty</h1>
          <p>Please select tickets from an event before proceeding to payment.</p>
          <Link className="checkout-page__emptyAction" to="/app/events">
            Browse events
          </Link>
        </section>
      </main>
    );
  }

  // STEP 2B: VIETQR PAYMENT SCREEN
  if (step === "vietqr" && currentPayment) {
    const isPending = currentPayment.status === "PENDING";
    const isExpired = currentPayment.status === "EXPIRED";
    const isPaid = currentPayment.status === "PAID";
    const isUnderpaid = currentPayment.status === "UNDERPAID";
    const isOverpaid = currentPayment.status === "OVERPAID";
    const isFailed = currentPayment.status === "FAILED";
    const transferMemo = currentPayment.transferContent || currentPayment.reference;

    return (
      <main className="checkout-page">
        <div className="checkout-page__container">
          {/* STEPPER IN VIETQR STATE */}
          <div className="checkout-page__topHeader checkout-page__topHeader--center">
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
                <span className="checkout-stepper__label">2. VietQR Payment</span>
              </div>

              <div className="checkout-stepper__line" />

              <div className="checkout-stepper__step">
                <span className="checkout-stepper__circle">3</span>
                <span className="checkout-stepper__label">3. Confirmation</span>
              </div>
            </div>
          </div>

          {/* VIETQR CARD */}
          <div className="checkout-vietqr">
            <div className="checkout-vietqr__card">
              <div className="checkout-vietqr__header">
                <h1>VietQR Bank Transfer</h1>
                <p>
                  Open your mobile banking app, scan the QR code or transfer to the account below with the exact transfer memo.
                </p>
              </div>

              {/* MULTI-ORGANIZATION BANNER & TABS */}
              {payments.length > 1 && (
                <>
                  <div className="checkout-vietqr__multiOrgBanner">
                    <strong>Multi-Organizer Order:</strong> Your cart contains tickets from {payments.length} different organizations. Please make a separate bank transfer for each order below.
                  </div>

                  <div className="checkout-vietqr__orderTabs" role="tablist">
                    {payments.map((p, idx) => {
                      const order = createdOrders[idx];
                      const orgName = order?.organization?.name || `Order #${idx + 1}`;
                      const isAct = idx === activeOrderIndex;
                      const status = p.status;
                      const badgeCls =
                        status === "PAID"
                          ? "checkout-vietqr__orderTabBadge--paid"
                          : status === "EXPIRED"
                          ? "checkout-vietqr__orderTabBadge--expired"
                          : "checkout-vietqr__orderTabBadge--pending";

                      return (
                        <button
                          key={p.paymentId || idx}
                          type="button"
                          role="tab"
                          aria-selected={isAct}
                          className={`checkout-vietqr__orderTab ${
                            isAct ? "checkout-vietqr__orderTab--active" : ""
                          }`}
                          onClick={() => setActiveOrderIndex(idx)}
                        >
                          <span>{orgName}</span>
                          <span className={`checkout-vietqr__orderTabBadge ${badgeCls}`}>
                            {status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="checkout-vietqr__grid">
                {/* LEFT COLUMN: QR CODE */}
                <div className="checkout-vietqr__qrSide">
                  <div className="checkout-vietqr__qrFrame">
                    {currentPayment.qrCode ? (
                      <img
                        src={currentPayment.qrCode}
                        alt="VietQR Code"
                        className="checkout-vietqr__qrImage"
                      />
                    ) : (
                      <div
                        style={{
                          width: 230,
                          height: 230,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                        }}
                      >
                        <QrCode size={48} />
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="checkout-vietqr__pollingBadge">
                      <span className="checkout-vietqr__pulseDot" />
                      <span>Waiting for payment verification...</span>
                    </div>
                  )}

                  {isPending && timeLeft !== null && (
                    <div className="checkout-vietqr__timerBox">
                      <Clock size={14} aria-hidden="true" />
                      <span>Expires in: {formatTimeLeft(timeLeft)}</span>
                    </div>
                  )}

                  {isExpired && (
                    <div className="checkout-vietqr__timerBox checkout-vietqr__timerBox--expired">
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span>Payment session has expired</span>
                    </div>
                  )}

                  {isPaid && (
                    <div
                      className="checkout-vietqr__timerBox"
                      style={{ background: "#dcfce7", color: "#166534", borderColor: "#86efac" }}
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      <span>Payment Verified</span>
                    </div>
                  )}

                  {isUnderpaid && (
                    <div
                      className="checkout-vietqr__timerBox"
                      style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}
                    >
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span>Payment Underpaid</span>
                    </div>
                  )}

                  {(isOverpaid || isFailed) && (
                    <div className="checkout-vietqr__timerBox checkout-vietqr__timerBox--expired">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span>Payment {isOverpaid ? "Overpaid" : "Failed"}</span>
                    </div>
                  )}

                  <small style={{ color: "#64748b", fontSize: "0.76rem" }}>
                    Supports 40+ banks via Napas247 / VietQR
                  </small>
                </div>

                {/* RIGHT COLUMN: BANK & TRANSFER DETAILS */}
                <div className="checkout-vietqr__infoSide">
                  <div className="checkout-vietqr__bankCard">
                    <div className="checkout-vietqr__row">
                      <span className="checkout-vietqr__label">Beneficiary Bank</span>
                      <div className="checkout-vietqr__valGroup">
                        <strong className="checkout-vietqr__value">{currentPayment.bank.name}</strong>
                        {currentPayment.bank.bin && (
                          <span style={{ color: "#64748b", fontSize: "0.78rem" }}>
                            ({currentPayment.bank.bin})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="checkout-vietqr__row">
                      <span className="checkout-vietqr__label">Account Name</span>
                      <strong className="checkout-vietqr__value">
                        {currentPayment.bank.accountName}
                      </strong>
                    </div>

                    <div className="checkout-vietqr__row">
                      <span className="checkout-vietqr__label">Account Number</span>
                      <div className="checkout-vietqr__valGroup">
                        <strong className="checkout-vietqr__value">
                          {currentPayment.bank.accountNumber}
                        </strong>
                        <button
                          type="button"
                          className={`checkout-vietqr__copyBtn ${
                            copiedField === "Account Number"
                              ? "checkout-vietqr__copyBtn--copied"
                              : ""
                          }`}
                          onClick={() =>
                            handleCopy(currentPayment.bank.accountNumber, "Account Number")
                          }
                          title="Copy account number"
                        >
                          {copiedField === "Account Number" ? (
                            <Check size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedField === "Account Number" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="checkout-vietqr__row">
                      <span className="checkout-vietqr__label">Transfer Amount</span>
                      <div className="checkout-vietqr__valGroup">
                        <strong className="checkout-vietqr__value checkout-vietqr__value--amount">
                          {formatBookingPrice(currentPayment.amount)}
                        </strong>
                        <button
                          type="button"
                          className={`checkout-vietqr__copyBtn ${
                            copiedField === "Amount" ? "checkout-vietqr__copyBtn--copied" : ""
                          }`}
                          onClick={() => handleCopy(String(currentPayment.amount), "Amount")}
                          title="Copy amount"
                        >
                          {copiedField === "Amount" ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedField === "Amount" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MEMO BOX */}
                  <div className="checkout-vietqr__memoBox">
                    <div className="checkout-vietqr__memoTop">
                      <span className="checkout-vietqr__memoLabel">
                        Transfer Memo (Required Exact Match)
                      </span>
                      <button
                        type="button"
                        className={`checkout-vietqr__copyBtn ${
                          copiedField === "Transfer Memo"
                            ? "checkout-vietqr__copyBtn--copied"
                            : ""
                        }`}
                        onClick={() => handleCopy(transferMemo, "Transfer Memo")}
                      >
                        {copiedField === "Transfer Memo" ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedField === "Transfer Memo" ? "Copied" : "Copy Memo"}</span>
                      </button>
                    </div>

                    <div className="checkout-vietqr__memoValueRow">
                      <span className="checkout-vietqr__memoCode">{transferMemo}</span>
                    </div>
                  </div>

                  <div className="checkout-vietqr__notice">
                    <strong>Important:</strong> Enter the exact transfer memo above so our automated bank gateway can match and issue your tickets immediately.
                  </div>

                  {/* ACTIONS */}
                  <div className="checkout-vietqr__actions">
                    <button
                      type="button"
                      className="checkout-vietqr__btnCheck"
                      disabled={isCheckingStatus}
                      onClick={handleCheckStatus}
                    >
                      <RefreshCw
                        size={16}
                        className={isCheckingStatus ? "animate-spin" : ""}
                        aria-hidden="true"
                      />
                      <span>
                        {isCheckingStatus ? "Checking status..." : "Check Payment Status Now"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="checkout-vietqr__btnLater"
                      onClick={() => setStep("confirmation")}
                    >
                      <span>Pay Later</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // STEP 3: ORDER CONFIRMATION / PAYMENT SUMMARY SCREEN
  if (step === "confirmation") {
    const allPaid = payments.length > 0 && payments.every((p) => p.status === "PAID");
    const anyPaid = payments.some((p) => p.status === "PAID");
    const allExpired = payments.length > 0 && payments.every((p) => p.status === "EXPIRED");

    const statusTitle = allPaid
      ? "Payment Successful!"
      : allExpired
      ? "Payment Expired"
      : anyPaid
      ? "Partially Paid — Action Required"
      : "Order Recorded — Pending Payment";

    const statusDesc = allPaid
      ? "All payments have been verified by the backend. Your tickets have been issued and sent to your ticket wallet."
      : allExpired
      ? "The payment session for this order has expired. Please select tickets and create a new order."
      : anyPaid
      ? "Some of your orders have been paid. Please complete payment for the remaining orders."
      : "Your order is recorded and waiting for VietQR transfer confirmation from the bank.";

    const statusBadgeText = allPaid
      ? "PAID"
      : allExpired
      ? "EXPIRED"
      : anyPaid
      ? "PARTIALLY PAID"
      : "PENDING PAYMENT";

    const totalCalculatedAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    return (
      <main className="checkout-page">
        <div className="checkout-page__container">
          {/* STEPPER IN CONFIRMATION STATE */}
          <div className="checkout-page__topHeader checkout-page__topHeader--center">
            <div className="checkout-stepper" aria-label="Checkout Progress">
              <div className="checkout-stepper__step checkout-stepper__step--completed">
                <span className="checkout-stepper__circle">
                  <CheckCircle2 size={15} aria-hidden="true" />
                </span>
                <span className="checkout-stepper__label">1. Review booking</span>
              </div>

              <div className="checkout-stepper__line checkout-stepper__line--active" />

              <div className="checkout-stepper__step checkout-stepper__step--completed">
                <span className="checkout-stepper__circle">
                  <CheckCircle2 size={15} aria-hidden="true" />
                </span>
                <span className="checkout-stepper__label">2. VietQR Payment</span>
              </div>

              <div className="checkout-stepper__line checkout-stepper__line--active" />

              <div className="checkout-stepper__step checkout-stepper__step--active">
                <span className="checkout-stepper__circle">3</span>
                <span className="checkout-stepper__label">3. Confirmation</span>
              </div>
            </div>
          </div>

          {/* CONFIRMATION CARD */}
          <div className="checkout-confirmation">
            <div className="checkout-confirmation__card">
              <div
                className="checkout-confirmation__iconWrap"
                style={{
                  background: allPaid ? "#dcfce7" : allExpired ? "#fee2e2" : "#fef3c7",
                  color: allPaid ? "#16a34a" : allExpired ? "#dc2626" : "#d97706",
                }}
              >
                {allPaid ? (
                  <CheckCircle2 size={32} aria-hidden="true" />
                ) : allExpired ? (
                  <AlertCircle size={32} aria-hidden="true" />
                ) : (
                  <Clock size={32} aria-hidden="true" />
                )}
              </div>

              <div className="checkout-confirmation__titleGroup">
                <h1>{statusTitle}</h1>
                <p>{statusDesc}</p>
              </div>

              <div
                className="checkout-confirmation__statusBadge"
                style={{
                  background: allPaid ? "#f0fdf4" : allExpired ? "#fef2f2" : "#fffbeb",
                  borderColor: allPaid ? "#bbf7d0" : allExpired ? "#fecaca" : "#fde68a",
                  color: allPaid ? "#166534" : allExpired ? "#991b1b" : "#b45309",
                }}
              >
                {allPaid ? (
                  <CheckCircle2 size={16} />
                ) : allExpired ? (
                  <AlertCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
                <span>Status: {statusBadgeText}</span>
              </div>

              {/* MULTI-ORGANIZATION ORDERS LIST */}
              {createdOrders.length > 1 && (
                <div className="checkout-confirmation__ordersList">
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "#334155",
                      display: "block",
                      marginBottom: "8px",
                      textAlign: "left",
                    }}
                  >
                    Orders by Organization ({createdOrders.length})
                  </span>
                  {createdOrders.map((ord, idx) => {
                    const p = payments[idx] || payments.find((item) => item.orderId === ord.id);
                    const isOrderPaid = p?.status === "PAID" || ord.status === "PAID";
                    const orgName = ord.organization?.name || `Organization ${idx + 1}`;
                    const orderAmount = p ? p.amount : ord.totalPrice;

                    return (
                      <div key={ord.id || idx} className="checkout-confirmation__orderCard">
                        <div className="checkout-confirmation__orderHeader">
                          <div>
                            <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>
                              {orgName}
                            </strong>
                            <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                              Order #{ord.id?.slice(0, 8)}
                            </div>
                          </div>
                          <span
                            className={`checkout-vietqr__orderTabBadge ${
                              isOrderPaid
                                ? "checkout-vietqr__orderTabBadge--paid"
                                : p?.status === "EXPIRED"
                                ? "checkout-vietqr__orderTabBadge--expired"
                                : "checkout-vietqr__orderTabBadge--pending"
                            }`}
                          >
                            {p?.status || ord.status || "PENDING"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "8px",
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                            {ord.items?.length || 1} ticket item(s)
                          </span>
                          <strong style={{ fontSize: "0.95rem", color: "#4f46e5" }}>
                            {formatBookingPrice(orderAmount)}
                          </strong>
                        </div>
                        {!isOrderPaid && p && (
                          <button
                            type="button"
                            className="checkout-confirmation__btnSecondary"
                            style={{
                              marginTop: "8px",
                              padding: "6px 12px",
                              fontSize: "0.78rem",
                              width: "auto",
                              display: "inline-flex",
                              alignSelf: "flex-start",
                            }}
                            onClick={() => {
                              setActiveOrderIndex(idx);
                              setStep("vietqr");
                            }}
                          >
                            <QrCode size={13} />
                            <span>Pay this order</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ORDER DETAILS SUMMARY TABLE */}
              <div className="checkout-confirmation__infoTable">
                {createdOrders.length === 1 && (
                  <div className="checkout-confirmation__infoRow">
                    <span>Order Reference</span>
                    <strong>#{String(createdOrders[0]?.id || currentPayment?.orderId || "PENDING").slice(0, 16)}</strong>
                  </div>
                )}
                {currentPayment?.paymentId && createdOrders.length === 1 && (
                  <div className="checkout-confirmation__infoRow">
                    <span>Payment ID</span>
                    <strong style={{ fontSize: "0.82rem" }}>
                      {String(currentPayment.paymentId).slice(0, 16)}...
                    </strong>
                  </div>
                )}
                <div className="checkout-confirmation__infoRow">
                  <span>Event</span>
                  <strong>{orderSnapshot?.eventTitle || firstEvent?.title || "Event Pass"}</strong>
                </div>
                <div className="checkout-confirmation__infoRow">
                  <span>Ticket Quantity</span>
                  <strong>
                    {orderSnapshot?.totalQuantity || totalQuantity}{" "}
                    {(orderSnapshot?.totalQuantity || totalQuantity) === 1 ? "ticket" : "tickets"}
                  </strong>
                </div>
                <div className="checkout-confirmation__infoRow">
                  <span>Recipient</span>
                  <strong>
                    {form.fullName} ({form.email})
                  </strong>
                </div>
                <div className="checkout-confirmation__infoRow">
                  <span>Contact Phone</span>
                  <strong>{form.phone}</strong>
                </div>
                <div className="checkout-confirmation__infoRow">
                  <span>Payment Method</span>
                  <strong>Bank Transfer (VietQR)</strong>
                </div>
                <div
                  className="checkout-confirmation__infoRow"
                  style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "4px" }}
                >
                  <span style={{ fontWeight: 600 }}>Total Amount</span>
                  <strong style={{ color: "#4f46e5", fontSize: "1.05rem" }}>
                    {formatBookingPrice(
                      totalCalculatedAmount > 0
                        ? totalCalculatedAmount
                        : (orderSnapshot?.totalPrice ?? totalPrice),
                    )}
                  </strong>
                </div>
              </div>

              {!allPaid && !allExpired && (
                <div className="checkout-confirmation__notice">
                  <strong>Pending Transfer:</strong> You can complete payment at any time before expiry. Your order is safely linked to your account.
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="checkout-confirmation__actions">
                {!allPaid && !allExpired && payments.length > 0 && (
                  <button
                    type="button"
                    className="checkout-confirmation__btnPrimary"
                    onClick={() => setStep("vietqr")}
                  >
                    <QrCode size={18} aria-hidden="true" />
                    <span>Continue VietQR Payment</span>
                  </button>
                )}

                {!allPaid && !allExpired && (
                  <button
                    type="button"
                    className="checkout-confirmation__btnSecondary"
                    disabled={isCheckingStatus}
                    onClick={handleCheckStatus}
                  >
                    <RefreshCw
                      size={16}
                      className={isCheckingStatus ? "animate-spin" : ""}
                      aria-hidden="true"
                    />
                    <span>{isCheckingStatus ? "Checking..." : "Check Status"}</span>
                  </button>
                )}

                {allPaid && (
                  <button
                    type="button"
                    className="checkout-confirmation__btnPrimary"
                    onClick={() =>
                      navigate("/app/tickets", {
                        state: { orders: createdOrders, isPending: false },
                      })
                    }
                  >
                    <Ticket size={18} aria-hidden="true" />
                    <span>View in My Tickets</span>
                  </button>
                )}

                <Link to="/app/events" className="checkout-confirmation__btnSecondary">
                  <span>Browse More Events</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }


  // STEP 2: CHECKOUT / PAYMENT SCREEN
  return (
    <main className="checkout-page">
      <div className="checkout-page__container">
        {/* TOP NAVIGATION & STEPPER */}
        <div className="checkout-page__topHeader">
          <button
            type="button"
            className="checkout-page__back"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
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
                <h2>Payment information</h2>
                <p>
                  Enter your contact details and choose your preferred payment method.
                </p>
              </div>

              {/* CONTACT FORM */}
              <div className="checkout-page__formGrid">
                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-fullname">
                    <User size={15} aria-hidden="true" />
                    <span>Full name *</span>
                  </label>
                  <input
                    id="checkout-fullname"
                    type="text"
                    placeholder="e.g. Nguyen Van A"
                    value={form.fullName}
                    disabled={isSubmitting}
                    className={touched.fullName && errors.fullName ? "checkout-input--error" : ""}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                  />
                  {touched.fullName && errors.fullName && (
                    <span className="checkout-form-error">{errors.fullName}</span>
                  )}
                </div>

                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-email">
                    <Mail size={15} aria-hidden="true" />
                    <span>Email address *</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={form.email}
                    disabled={isSubmitting}
                    className={touched.email && errors.email ? "checkout-input--error" : ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                  />
                  {touched.email && errors.email && (
                    <span className="checkout-form-error">{errors.email}</span>
                  )}
                </div>

                <div className="checkout-page__formGroup">
                  <label htmlFor="checkout-phone">
                    <Phone size={15} aria-hidden="true" />
                    <span>Phone number *</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    placeholder="e.g. +84 987 654 321"
                    value={form.phone}
                    disabled={isSubmitting}
                    className={touched.phone && errors.phone ? "checkout-input--error" : ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                  />
                  {touched.phone && errors.phone && (
                    <span className="checkout-form-error">{errors.phone}</span>
                  )}
                </div>
              </div>

              <small
                style={{
                  display: "block",
                  color: "#64748b",
                  fontSize: "0.78rem",
                  marginTop: "10px",
                  lineHeight: "1.45",
                }}
              >
                * Contact info is used for ticket validation and recipient display. The order will be linked to your account profile.
              </small>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="checkout-page__methodsSection">
                <span className="checkout-page__methodsTitle">
                  Select payment method
                </span>

                <div className="checkout-page__methodsList">
                  {/* Option 1: Bank transfer (ACTIVE) */}
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
                      disabled={isSubmitting}
                      onChange={() => handleSelectMethod("bank")}
                    />
                    <span className="checkout-method__icon">
                      <Building size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <div>
                        <strong>Bank transfer (VietQR)</strong>
                        <span className="checkout-method__badge--active">Instant Verification</span>
                      </div>
                      <small>Scan VietQR code with any banking app. Verified automatically via bank gateway in seconds.</small>
                    </div>
                  </label>

                  {/* Option 2: Card payment (PENDING INTEGRATION) */}
                  <label
                    className={`checkout-method checkout-method--disabled ${
                      paymentMethod === "card" ? "checkout-method--active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectMethod("card");
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      disabled={true}
                    />
                    <span className="checkout-method__icon">
                      <CreditCard size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <div>
                        <strong>Card payment</strong>
                        <span className="checkout-method__badge--pending">Pending Integration</span>
                      </div>
                      <small>Credit / Debit cards (Visa, Mastercard, JCB) — Gateway connecting</small>
                    </div>
                  </label>

                  {/* Option 3: E-wallet (PENDING INTEGRATION) */}
                  <label
                    className={`checkout-method checkout-method--disabled ${
                      paymentMethod === "wallet" ? "checkout-method--active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectMethod("wallet");
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      disabled={true}
                    />
                    <span className="checkout-method__icon">
                      <Wallet size={18} aria-hidden="true" />
                    </span>
                    <div className="checkout-method__text">
                      <div>
                        <strong>E-wallet</strong>
                        <span className="checkout-method__badge--pending">Pending Integration</span>
                      </div>
                      <small>MoMo, ZaloPay, ShopeePay, VNPay QR — Gateway connecting</small>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* 2. BILLING SUMMARY */}
            <section className="checkout-page__card checkout-page__billingCard">
              <div className="checkout-page__cardHeader">
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
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <span>Place order & Pay with VietQR</span>
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
                  <span>Instant order registration to ticket wallet</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
