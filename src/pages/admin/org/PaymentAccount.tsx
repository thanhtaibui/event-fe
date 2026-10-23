import {
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Landmark,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

import {
  ADMIN_PERMISSION_CODES,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipOrganizationId,
  getMembershipSlug,
  hasPermission,
  isOrgOwnerForUser,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import { getAccessToken } from "../../../constants/authStorage";
import { useOrgBySlug } from "../../../hooks/admin/org/useOrgBySlug";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import { orgService } from "../../../services/admin/organization.service";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import type {
  OrganizationPaymentAccountResponse,
  UpsertOrganizationPaymentAccountDto,
} from "../../../types/organization/organization";

export interface PopularBank {
  bin: string;
  name: string;
  shortName: string;
  code: string;
  fullName: string;
  logo: string;
}

// Danh sách ngân hàng phổ biến tại Việt Nam với logo chuẩn VietQR CDN
export const VIETNAM_POPULAR_BANKS: PopularBank[] = [
  { bin: "970422", name: "MBBank", shortName: "MB", code: "MB", fullName: "Military Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/MB.png" },
  { bin: "970407", name: "Techcombank", shortName: "TCB", code: "TCB", fullName: "Vietnam Technological and Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/TCB.png" },
  { bin: "970436", name: "Vietcombank", shortName: "VCB", code: "VCB", fullName: "Joint Stock Commercial Bank for Foreign Trade of Vietnam", logo: "https://cdn.vietqr.io/img/VCB.png" },
  { bin: "970415", name: "VietinBank", shortName: "CTG", code: "ICB", fullName: "Vietnam Joint Stock Commercial Bank for Industry and Trade", logo: "https://cdn.vietqr.io/img/ICB.png" },
  { bin: "970418", name: "BIDV", shortName: "BIDV", code: "BIDV", fullName: "Bank for Investment and Development of Vietnam", logo: "https://cdn.vietqr.io/img/BIDV.png" },
  { bin: "970416", name: "ACB", shortName: "ACB", code: "ACB", fullName: "Asia Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/ACB.png" },
  { bin: "970432", name: "VPBank", shortName: "VPB", code: "VPB", fullName: "Vietnam Prosperity Joint Stock Commercial Bank", logo: "https://cdn.vietqr.io/img/VPB.png" },
  { bin: "970423", name: "TPBank", shortName: "TPB", code: "TPB", fullName: "Tien Phong Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/TPB.png" },
  { bin: "970405", name: "Agribank", shortName: "VBA", code: "VBA", fullName: "Vietnam Bank for Agriculture and Rural Development", logo: "https://cdn.vietqr.io/img/VBA.png" },
  { bin: "970403", name: "Sacombank", shortName: "STB", code: "STB", fullName: "Saigon Thuong Tin Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/SACOMBANK.png" },
  { bin: "970437", name: "HDBank", shortName: "HDB", code: "HDB", fullName: "Ho Chi Minh City Development Joint Stock Commercial Bank", logo: "https://cdn.vietqr.io/img/HDB.png" },
  { bin: "970441", name: "VIB", shortName: "VIB", code: "VIB", fullName: "Vietnam International Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/VIB.png" },
  { bin: "970443", name: "SHB", shortName: "SHB", code: "SHB", fullName: "Saigon - Hanoi Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/SHB.png" },
  { bin: "970426", name: "MSB", shortName: "MSB", code: "MSB", fullName: "Vietnam Maritime Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/MSB.png" },
  { bin: "970448", name: "OCB", shortName: "OCB", code: "OCB", fullName: "Orient Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/OCB.png" },
  { bin: "970440", name: "SeABank", shortName: "SSB", code: "SEAB", fullName: "Southeast Asia Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/SEAB.png" },
  { bin: "970431", name: "Eximbank", shortName: "EIB", code: "EIB", fullName: "Vietnam Export Import Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/EIB.png" },
  { bin: "970449", name: "LPBank", shortName: "LPB", code: "LPB", fullName: "Loc Phat Vietnam Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/LPBANK.png" },
  { bin: "970428", name: "Nam A Bank", shortName: "NAB", code: "NAB", fullName: "Nam A Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/NAB.png" },
  { bin: "970409", name: "Bac A Bank", shortName: "BAB", code: "BAB", fullName: "Bac A Commercial Joint Stock Bank", logo: "https://cdn.vietqr.io/img/BAB.png" },
  { bin: "970412", name: "PVcomBank", shortName: "PVCB", code: "PVCB", fullName: "Vietnam Public Joint Stock Commercial Bank", logo: "https://cdn.vietqr.io/img/PVCB.png" },
  { bin: "546034", name: "Cake by VPBank", shortName: "CAKE", code: "CAKE", fullName: "Cake by VPBank Digital Bank", logo: "https://cdn.vietqr.io/img/CAKE.png" },
  { bin: "963388", name: "Timo", shortName: "TIMO", code: "TIMO", fullName: "Timo Digital Bank by Ban Viet", logo: "https://cdn.vietqr.io/img/TIMO.png" },
];

export function getBankByBin(bin?: string): PopularBank | null {
  if (!bin) return null;
  return VIETNAM_POPULAR_BANKS.find((b) => b.bin === bin) || null;
}

function maskAccountNumber(acc?: string): string {
  if (!acc) return "Not configured";
  if (acc.includes("*") || acc.includes("•")) return acc;
  const cleaned = acc.trim();
  if (cleaned.length <= 4) return cleaned;
  const lastFour = cleaned.slice(-4);
  const maskedPrefix = "•".repeat(Math.min(cleaned.length - 4, 8));
  return `${maskedPrefix} ${lastFour}`;
}

export function parsePaymentAccountError(err: any): string {
  if (!err?.response) {
    if (err?.code === "ECONNABORTED" || (err?.message && err.message.toLowerCase().includes("timeout"))) {
      return "Request timed out. Please check your network connection and try again.";
    }
    if (err?.message === "Network Error" || (err?.message && err.message.toLowerCase().includes("network"))) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    return "No response from the server. Please try again later.";
  }

  const status = err.response.status;
  const data = err.response.data;
  const code = (data?.code || data?.errorCode || "").toString().toUpperCase();
  const rawMsg = Array.isArray(data?.message)
    ? data.message.join("; ")
    : (data?.message || data?.error || "");
  const upperRaw = rawMsg.toString().toUpperCase();

  if (status === 401) {
    return "Session expired. Please log in again to continue.";
  }
  if (status === 403) {
    return "You do not have permission to manage this organization's payment account.";
  }
  if (code === "BANK_BIN_REQUIRED" || upperRaw.includes("BANK_BIN_REQUIRED")) {
    return "Beneficiary bank is required.";
  }
  if (code === "BANK_UNSUPPORTED" || upperRaw.includes("BANK_UNSUPPORTED")) {
    return "This bank is currently not supported for payouts.";
  }
  if (code === "INVALID_BANK_ACCOUNT" || upperRaw.includes("INVALID_BANK_ACCOUNT")) {
    return "Invalid bank account number format (must be 6 to 19 digits).";
  }
  if (code === "ACCOUNT_HOLDER_NAME_REQUIRED" || upperRaw.includes("ACCOUNT_HOLDER_NAME_REQUIRED")) {
    return "Account holder name is required.";
  }
  if (code === "INVALID_ACCOUNT_NAME" || upperRaw.includes("INVALID_ACCOUNT_NAME")) {
    return "Invalid account holder name (must not be empty, max 120 characters).";
  }
  if (rawMsg && rawMsg.includes("Cannot change receiving account while payments are pending")) {
    return "Cannot change receiving account while payments are pending.";
  }
  if (status === 400) {
    return rawMsg || "Invalid payment account details. Please check your information.";
  }
  if (status >= 500) {
    return rawMsg && !rawMsg.toLowerCase().includes("internal server error")
      ? rawMsg
      : "Server encountered an error while saving payment account. Please try again later.";
  }
  return rawMsg || "Failed to save payment account.";
}

export default function PaymentAccount() {
  const { slug } = useParams<{ slug: string }>();
  const { data: currentOrg, loading: orgLoading } = useOrgBySlug(slug || "");

  // Authentication & Membership Context
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";
    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);

  const { data: userOrgsData, loading: userOrgsLoading } = useOrgsByUser(currentUserId);
  const activeMembership = useMemo(() => {
    if (!slug) return null;
    const list = normalizeUserMemberships(userOrgsData);
    return list.find((m) => getMembershipSlug(m) === slug) || null;
  }, [slug, userOrgsData]);

  // Permissions: Only Owner or members with payment management permissions
  const isOwner = useMemo(() => {
    return isOrgOwnerForUser(activeMembership, currentUserId);
  }, [activeMembership, currentUserId]);

  const permissionCodes = useMemo(() => {
    if (!activeMembership) return getJwtPermissionCodes();
    return getEffectiveOrgPermissionCodes(activeMembership, currentUserId);
  }, [activeMembership, currentUserId]);

  const canManage = useMemo(() => {
    return (
      isOwner ||
      hasPermission(permissionCodes, ADMIN_PERMISSION_CODES.ORGANIZATION_PAYMENT_MANAGE) ||
      hasPermission(permissionCodes, ADMIN_PERMISSION_CODES.PAYMENT_ACCOUNT)
    );
  }, [isOwner, permissionCodes]);

  const organizationId = useMemo(() => {
    return (
      currentOrg?.id ||
      currentOrg?.data?.id ||
      currentOrg?.organization?.id ||
      getMembershipOrganizationId(activeMembership) ||
      ""
    );
  }, [activeMembership, currentOrg]);

  // Account State from BE
  const [accountData, setAccountData] = useState<OrganizationPaymentAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State
  const [selectedBankBin, setSelectedBankBin] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [customBankBin, setCustomBankBin] = useState("");
  const [isCustomBank, setIsCustomBank] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Bank Picker UI State
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const bankPickerRef = useRef<HTMLDivElement>(null);

  // Click outside to close bank picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankPickerRef.current && !bankPickerRef.current.contains(event.target as Node)) {
        setIsBankPickerOpen(false);
      }
    };

    if (isBankPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBankPickerOpen]);

  // Filtered banks for search
  const filteredBanks = useMemo(() => {
    const q = bankSearchQuery.trim().toLowerCase();
    if (!q) return VIETNAM_POPULAR_BANKS;
    return VIETNAM_POPULAR_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.bin.includes(q)
    );
  }, [bankSearchQuery]);

  // Selected bank object
  const currentSelectedBank = useMemo(() => {
    if (isCustomBank) return null;
    return VIETNAM_POPULAR_BANKS.find((b) => b.bin === selectedBankBin) || null;
  }, [isCustomBank, selectedBankBin]);

  // 1. Fetch payment account from GET /organizations/:organizationId/payment-account
  const fetchPaymentAccount = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setFetchError(null);
      const res = await orgService.getPaymentAccount(organizationId);

      if (res && (res.bankBin || res.bankName || res.accountNumber || res.accountName || res.accountHolderName)) {
        setAccountData(res);
        const matchedBank = VIETNAM_POPULAR_BANKS.find((b) => b.bin === res.bankBin);
        if (matchedBank) {
          setSelectedBankBin(matchedBank.bin);
          setIsCustomBank(false);
        } else if (res.bankBin) {
          setIsCustomBank(true);
          setCustomBankBin(res.bankBin || "");
          setCustomBankName(res.bankName || "");
        }
        if (res.accountNumber && !res.accountNumber.includes("*") && !res.accountNumber.includes("•")) {
          setAccountNumber(res.accountNumber);
        } else {
          setAccountNumber("");
        }
        const holderName = res.accountHolderName || res.accountName || res.verifiedAccountName || "";
        if (holderName) {
          setAccountHolderName(holderName);
        }
      } else {
        setAccountData(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAccountData(null);
      } else if (err?.response?.status === 403) {
        setFetchError("You do not have permission to view this organization's payment account.");
      } else {
        setFetchError(err?.response?.data?.message || "Failed to load payment account details.");
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchPaymentAccount();
    } else if (!orgLoading && !userOrgsLoading) {
      setLoading(false);
    }
  }, [fetchPaymentAccount, organizationId, orgLoading, userOrgsLoading]);

  // Select bank from picker
  const handleSelectBank = (bank: PopularBank) => {
    setIsCustomBank(false);
    setSelectedBankBin(bank.bin);
    setCustomBankName(bank.name);
    setCustomBankBin(bank.bin);
    setIsBankPickerOpen(false);
    setBankSearchQuery("");
    setSaveError(null);
    setSaveSuccess(false);
    setFormErrors((prev) => ({ ...prev, bankBin: "", bankName: "" }));
  };

  const handleSelectCustomBank = () => {
    setIsCustomBank(true);
    setSelectedBankBin("");
    setIsBankPickerOpen(false);
    setBankSearchQuery("");
    setSaveError(null);
    setSaveSuccess(false);
    setFormErrors((prev) => ({ ...prev, bankBin: "", bankName: "" }));
  };

  // Validate form inputs
  const validateFormInputs = (): boolean => {
    const errors: Record<string, string> = {};

    const effectiveBin = isCustomBank ? customBankBin.trim() : selectedBankBin;
    const effectiveBankName = isCustomBank
      ? customBankName.trim()
      : VIETNAM_POPULAR_BANKS.find((b) => b.bin === selectedBankBin)?.name || "";

    if (!effectiveBin) {
      errors.bankBin = "Please select a beneficiary bank.";
    } else if (!/^\d{6}$/.test(effectiveBin)) {
      errors.bankBin = "Bank BIN must be exactly 6 digits.";
    }

    if (isCustomBank && !effectiveBankName) {
      errors.bankName = "Please enter bank name.";
    }

    const cleanAccNum = accountNumber.trim();
    if (!cleanAccNum) {
      errors.accountNumber = "Please enter bank account number.";
    } else if (!/^\d{6,19}$/.test(cleanAccNum)) {
      errors.accountNumber = "Invalid bank account number (must be 6 to 19 digits).";
    }

    const cleanHolderName = accountHolderName.trim().replace(/\s+/g, " ");
    if (!cleanHolderName) {
      errors.accountHolderName = "Please enter account holder name.";
    } else if (cleanHolderName.length < 2 || cleanHolderName.length > 120) {
      errors.accountHolderName = "Account holder name must be between 2 and 120 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isConfigured = Boolean(
    accountData && (accountData.bankBin || accountData.accountNumber || accountData.accountName)
  );

  // Reflect truthful verification status from Backend
  const effectiveVerificationStatus = useMemo(() => {
    if (!isConfigured) {
      return "NOT_CONFIGURED" as const;
    }
    if (accountData?.verificationStatus === "VERIFIED") {
      return "VERIFIED" as const;
    }
    if (accountData?.verificationStatus === "FAILED") {
      return "FAILED" as const;
    }
    return "PENDING" as const;
  }, [accountData, isConfigured]);

  // Single Save Action: Validate and save directly according to Backend API contract
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!canManage) {
      toast.error("You do not have permission to manage this organization's payment account.");
      return;
    }

    if (!organizationId) {
      toast.error("Organization ID not found.");
      return;
    }

    if (!validateFormInputs()) {
      return;
    }

    const effectiveBin = isCustomBank ? customBankBin.trim() : selectedBankBin;
    const cleanAccNum = accountNumber.trim();
    const cleanHolderName = accountHolderName.trim().replace(/\s+/g, " ").toUpperCase();

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const payload: UpsertOrganizationPaymentAccountDto = {
        bankBin: effectiveBin,
        accountNumber: cleanAccNum,
        accountHolderName: cleanHolderName,
        accountName: cleanHolderName,
      };

      const res = await orgService.updatePaymentAccount(organizationId, payload);
      setAccountData(res);
      setAccountNumber("");
      if (res.accountHolderName || res.accountName) {
        setAccountHolderName(res.accountHolderName || res.accountName || cleanHolderName);
      }
      setSaveSuccess(true);
      toast.success("Payment account saved successfully.");
    } catch (err: any) {
      setSaveSuccess(false);
      const displayMsg = parsePaymentAccountError(err);
      setSaveError(displayMsg);
      toast.error(displayMsg);
    } finally {
      setSaving(false);
    }
  };

  const displayMaskedAcc = useMemo(() => {
    if (!accountData) return "Not configured";
    if (accountData.maskedAccountNumber) return accountData.maskedAccountNumber;
    return maskAccountNumber(accountData.accountNumber);
  }, [accountData]);

  const currentPreviewBin = isCustomBank
    ? customBankBin
    : selectedBankBin || accountData?.bankBin || "";

  // Loading Screen
  if (orgLoading || userOrgsLoading || (loading && !accountData)) {
    return (
      <div className="admin-page payment-account-page">
        <div className="payment-account-loading">
          <Loader2 className="payment-account-spinner" size={36} />
          <p>Loading payment account details...</p>
        </div>
      </div>
    );
  }

  // Access Blocked Screen
  if (!canManage) {
    return (
      <div className="admin-page payment-account-page">
        <section className="payment-account-blocked">
          <ShieldAlert size={48} className="payment-account-blocked__icon" />
          <h2>Access Restricted</h2>
          <p>
            Only the <strong>Organization Owner</strong> or authorized members can configure payout accounts.
          </p>
          <Link to={`/org/${slug}/dashboard`} className="payment-account-btn payment-account-btn--secondary">
            Return to Dashboard
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page payment-account-page">
      {/* 1. HERO HEADER */}
      <section className="payment-account-hero">
        <div className="payment-account-hero__content">
          <span className="payment-account-hero__eyebrow">
            <Landmark size={15} aria-hidden="true" />
            Payment Settings
          </span>
          <h1>Payment Account</h1>
          <p>
            Configure your receiving bank account to receive event ticket payouts via VietQR.
          </p>
        </div>
        <div className="payment-account-hero__actions">
          <button
            type="button"
            className="payment-account-btn payment-account-btn--outline"
            onClick={fetchPaymentAccount}
            disabled={loading || saving}
            title="Refresh payment account details"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* 2. PERSISTENT STATUS / VERIFICATION BANNERS */}
      {accountData?.verificationStatus === "FAILED" && (
        <section className="payment-account-failed-banner" role="alert">
          <div className="payment-account-failed-banner__icon">
            <XCircle size={24} />
          </div>
          <div className="payment-account-failed-banner__body">
            <strong>Verification Failed</strong>
            <p>
              {accountData.verificationFailureReason ||
                "Beneficiary account information could not be verified. Please review and update your details."}
            </p>
          </div>
        </section>
      )}

      {/* 3. SUCCESS BANNER */}
      {saveSuccess && (
        <section className="payment-account-success-banner" role="status">
          <div className="payment-account-success-banner__icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="payment-account-success-banner__body">
            <strong>Payment account saved successfully.</strong>
            <p>
              Beneficiary account details for <strong>{accountData?.accountHolderName || accountData?.accountName || accountHolderName}</strong> at <strong>{accountData?.bankName || currentSelectedBank?.name || "selected bank"}</strong> have been saved.
            </p>
          </div>
        </section>
      )}

      {fetchError && (
        <section className="payment-account-error-banner" role="alert">
          <AlertTriangle size={20} />
          <span>{fetchError}</span>
        </section>
      )}

      {/* 4. OVERVIEW STATS CARDS */}
      <section className="payment-account-stats" aria-label="Payment account summary">
        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Verification Status</span>
          <div className="payment-account-stat-card__value">
            {effectiveVerificationStatus === "VERIFIED" ? (
              <span className="payment-account-badge payment-account-badge--success">
                <ShieldCheck size={14} /> Verified
              </span>
            ) : effectiveVerificationStatus === "FAILED" ? (
              <span className="payment-account-badge payment-account-badge--danger">
                <XCircle size={14} /> Failed
              </span>
            ) : isConfigured ? (
              <span className="payment-account-badge payment-account-badge--pending">
                <Clock size={14} /> Not Verified by Bank
              </span>
            ) : (
              <span className="payment-account-badge payment-account-badge--warning">
                <AlertTriangle size={14} /> Not Configured
              </span>
            )}
          </div>
          <small className="payment-account-stat-card__sub">
            {effectiveVerificationStatus === "VERIFIED"
              ? "Ready to receive VietQR payouts"
              : effectiveVerificationStatus === "FAILED"
              ? "Account rejected by bank"
              : isConfigured
              ? "Format validated"
              : "Setup required to receive payouts"}
          </small>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Bank</span>
          <div className="payment-account-stat-card__bank-row">
            {accountData?.bankBin && getBankByBin(accountData.bankBin)?.logo ? (
              <div className="payment-account-stat-card__logo-wrap">
                <img
                  src={getBankByBin(accountData.bankBin)!.logo}
                  alt={accountData?.bankName || "Bank logo"}
                  className="payment-account-stat-card__logo"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="payment-account-stat-card__bank-texts">
              <strong className="payment-account-stat-card__title">
                {accountData?.bankName || "Not configured"}
              </strong>
              <small className="payment-account-stat-card__sub">
                {accountData?.bankBin
                  ? (getBankByBin(accountData.bankBin)?.shortName || "Supported Bank")
                  : "No bank selected"}
              </small>
            </div>
          </div>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Account Number</span>
          <strong className="payment-account-stat-card__title payment-account-stat-card__title--mono">
            {displayMaskedAcc}
          </strong>
          <small className="payment-account-stat-card__sub">Partially masked</small>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Account Holder Name</span>
          <strong className="payment-account-stat-card__title">
            {accountData?.accountHolderName || accountData?.accountName || "Not configured"}
          </strong>
          <small className="payment-account-stat-card__sub">
            {effectiveVerificationStatus === "VERIFIED"
              ? "Verified by bank"
              : isConfigured
              ? "Registered beneficiary"
              : "Not configured"}
          </small>
        </article>
      </section>

      {/* 5. FORM & LIVE PREVIEW GRID */}
      <div className="payment-account-grid">
        {/* LEFT COLUMN: FORM */}
        <section className="payment-account-panel">
          <div className="payment-account-panel__header">
            <div>
              <h2>{isConfigured ? "Update Payment Account" : "Set Up Payment Account"}</h2>
              <p>Configure receiving bank account details for ticket payouts.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="payment-account-form" noValidate>
            {/* Field: Beneficiary Bank Picker with Logo & Search */}
            <div className="payment-account-field" ref={bankPickerRef}>
              <label>
                Bank <span className="req">*</span>
              </label>

              {/* Custom Bank Selector Trigger */}
              <div
                className={`bank-picker-trigger ${isBankPickerOpen ? "bank-picker-trigger--open" : ""} ${
                  formErrors.bankBin ? "input-error" : ""
                }`}
                onClick={() => !saving && setIsBankPickerOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsBankPickerOpen((prev) => !prev);
                  }
                }}
              >
                {currentSelectedBank ? (
                  <div className="bank-picker-trigger__selected">
                    <div className="bank-picker-logo-container">
                      <img
                        src={currentSelectedBank.logo}
                        alt={currentSelectedBank.name}
                        className="bank-picker-logo"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="bank-picker-trigger__info">
                      <div className="bank-picker-trigger__title">
                        <strong>{currentSelectedBank.name}</strong>
                        <span className="bank-picker-tag">({currentSelectedBank.shortName})</span>
                      </div>
                      <small className="bank-picker-trigger__desc">{currentSelectedBank.fullName}</small>
                    </div>
                  </div>
                ) : isCustomBank ? (
                  <div className="bank-picker-trigger__selected">
                    <div className="bank-picker-logo-container bank-picker-logo-container--custom">
                      <Building size={20} />
                    </div>
                    <div className="bank-picker-trigger__info">
                      <div className="bank-picker-trigger__title">
                        <strong>{customBankName || "Other Bank"}</strong>
                      </div>
                      <small className="bank-picker-trigger__desc">Custom bank</small>
                    </div>
                  </div>
                ) : (
                  <div className="bank-picker-trigger__placeholder">
                    <Landmark size={18} />
                    <span>Select bank</span>
                  </div>
                )}

                <div className="bank-picker-trigger__arrow">
                  <ChevronDown size={18} className={isBankPickerOpen ? "rotate-180" : ""} />
                </div>
              </div>

              {/* Dropdown Popover */}
              {isBankPickerOpen && (
                <div className="bank-picker-popover">
                  <div className="bank-picker-search">
                    <Search size={16} className="bank-picker-search__icon" />
                    <input
                      type="text"
                      placeholder="Search bank name or code..."
                      value={bankSearchQuery}
                      onChange={(e) => setBankSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    {bankSearchQuery && (
                      <button
                        type="button"
                        className="bank-picker-search__clear"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBankSearchQuery("");
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="bank-picker-list">
                    {filteredBanks.map((bank) => {
                      const isCurrent = !isCustomBank && selectedBankBin === bank.bin;
                      return (
                        <div
                          key={bank.bin}
                          className={`bank-picker-item ${isCurrent ? "bank-picker-item--active" : ""}`}
                          onClick={() => handleSelectBank(bank)}
                        >
                          <div className="bank-picker-logo-container">
                            <img
                              src={bank.logo}
                              alt={bank.name}
                              className="bank-picker-logo"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                          <div className="bank-picker-item__details">
                            <div className="bank-picker-item__name-row">
                              <span className="bank-picker-item__name">{bank.name}</span>
                              <span className="bank-picker-item__code">({bank.shortName})</span>
                            </div>
                            <span className="bank-picker-item__full">{bank.fullName}</span>
                          </div>
                          {isCurrent && (
                            <div className="bank-picker-item__check">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredBanks.length === 0 && (
                      <div className="bank-picker-empty">
                        <p>No banks match "{bankSearchQuery}"</p>
                      </div>
                    )}
                  </div>

                  {/* Option: Other Bank */}
                  <div className="bank-picker-footer" onClick={handleSelectCustomBank}>
                    <div className="bank-picker-logo-container bank-picker-logo-container--custom">
                      <Building size={18} />
                    </div>
                    <div className="bank-picker-footer__text">
                      <strong>Other Bank</strong>
                      <small>Enter bank details manually</small>
                    </div>
                  </div>
                </div>
              )}

              {formErrors.bankBin && <span className="field-error">{formErrors.bankBin}</span>}
            </div>

            {/* Custom Bank Manual Inputs */}
            {isCustomBank && (
              <div className="payment-account-field-row">
                <div className="payment-account-field">
                  <label htmlFor="customBankName">
                    Bank Name <span className="req">*</span>
                  </label>
                  <input
                    id="customBankName"
                    type="text"
                    placeholder="Enter bank name"
                    value={customBankName}
                    onChange={(e) => {
                      setCustomBankName(e.target.value);
                      if (formErrors.bankName) {
                        setFormErrors((prev) => ({ ...prev, bankName: "" }));
                      }
                    }}
                    disabled={saving}
                    className={formErrors.bankName ? "input-error" : ""}
                  />
                  {formErrors.bankName && <span className="field-error">{formErrors.bankName}</span>}
                </div>
                <div className="payment-account-field">
                  <label htmlFor="customBankBin">
                    Bank BIN (6 digits) <span className="req">*</span>
                  </label>
                  <input
                    id="customBankBin"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit BIN"
                    value={customBankBin}
                    onChange={(e) => {
                      setCustomBankBin(e.target.value.replace(/\D/g, ""));
                      if (formErrors.bankBin) {
                        setFormErrors((prev) => ({ ...prev, bankBin: "" }));
                      }
                    }}
                    disabled={saving}
                    className={formErrors.bankBin ? "input-error" : ""}
                  />
                </div>
              </div>
            )}

            {/* Bank Account Number */}
            <div className="payment-account-field">
              <label htmlFor="accountNumber">
                Account Number <span className="req">*</span>
              </label>
              <input
                id="accountNumber"
                type="text"
                maxLength={19}
                placeholder={isConfigured ? "Enter new account number" : "Enter account number"}
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ""));
                  setSaveError(null);
                  setSaveSuccess(false);
                  if (formErrors.accountNumber) {
                    setFormErrors((prev) => ({ ...prev, accountNumber: "" }));
                  }
                }}
                disabled={saving}
                className={formErrors.accountNumber ? "input-error" : ""}
                autoComplete="off"
              />
              {formErrors.accountNumber && (
                <span className="field-error">{formErrors.accountNumber}</span>
              )}
            </div>

            {/* Account Holder Name */}
            <div className="payment-account-field">
              <label htmlFor="accountHolderName">
                Account Holder Name <span className="req">*</span>
              </label>
              <input
                id="accountHolderName"
                type="text"
                maxLength={120}
                placeholder="Enter account holder name"
                value={accountHolderName}
                onChange={(e) => {
                  setAccountHolderName(e.target.value.toUpperCase());
                  setSaveError(null);
                  setSaveSuccess(false);
                  if (formErrors.accountHolderName) {
                    setFormErrors((prev) => ({ ...prev, accountHolderName: "" }));
                  }
                }}
                disabled={saving}
                className={formErrors.accountHolderName ? "input-error" : ""}
                autoComplete="off"
              />
              {formErrors.accountHolderName && (
                <span className="field-error">{formErrors.accountHolderName}</span>
              )}
            </div>

            {/* Save Error Banner */}
            {saveError && (
              <div className="payment-account-lookup-error" role="alert">
                <AlertTriangle size={18} />
                <span>{saveError}</span>
              </div>
            )}

            {/* Actions: Save Changes and Cancel */}
            <div className="payment-account-form-actions">
              <button
                type="submit"
                className="payment-account-btn payment-account-btn--primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                className="payment-account-btn payment-account-btn--ghost"
                onClick={() => {
                  setFormErrors({});
                  setSaveError(null);
                  setSaveSuccess(false);
                  setIsBankPickerOpen(false);
                  setAccountNumber("");
                  setAccountHolderName(accountData?.accountHolderName || accountData?.accountName || "");
                  fetchPaymentAccount();
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: LIVE CARD PREVIEW & GUIDE */}
        <aside className="payment-account-side">
          {/* Card Preview */}
          <div className="payment-account-card-preview">
            <div className="payment-account-card-preview__top">
              <div className="payment-account-card-preview__chip"></div>
              <div className="payment-account-card-preview__top-right">
                {effectiveVerificationStatus === "VERIFIED" ? (
                  <span className="card-preview-indicator card-preview-indicator--verified">
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : effectiveVerificationStatus === "FAILED" ? (
                  <span className="card-preview-indicator card-preview-indicator--failed">
                    <XCircle size={11} /> Failed
                  </span>
                ) : isConfigured ? (
                  <span className="card-preview-indicator card-preview-indicator--pending">
                    <Clock size={11} /> Not Verified by Bank
                  </span>
                ) : (
                  <span className="card-preview-indicator card-preview-indicator--unverified">
                    Not Configured
                  </span>
                )}
                <span className="payment-account-card-preview__brand">NAPAS 247 · VietQR</span>
              </div>
            </div>

            <div className="payment-account-card-preview__bank">
              {currentPreviewBin && getBankByBin(currentPreviewBin)?.logo ? (
                <div className="payment-account-card-preview__logo-wrap">
                  <img
                    src={getBankByBin(currentPreviewBin)!.logo}
                    alt="Bank logo"
                    className="payment-account-card-preview__logo"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <Landmark size={20} />
              )}
              <span>
                {isCustomBank
                  ? customBankName || "BANK"
                  : currentSelectedBank?.name ||
                    accountData?.bankName ||
                    "SELECT BANK"}
              </span>
            </div>

            <div className="payment-account-card-preview__number">
              {accountNumber
                ? maskAccountNumber(accountNumber)
                : displayMaskedAcc !== "Not configured"
                ? displayMaskedAcc
                : "•••• •••• •••• ••••"}
            </div>

            <div className="payment-account-card-preview__bottom">
              <div>
                <small>ACCOUNT HOLDER</small>
                <strong>
                  {accountHolderName ||
                    accountData?.accountHolderName ||
                    accountData?.accountName ||
                    "ACCOUNT HOLDER"}
                </strong>
              </div>
              <div className="payment-account-card-preview__bin">
                <small>NETWORK</small>
                <strong>NAPAS 247</strong>
              </div>
            </div>
          </div>

          {/* Note minh bạch theo spec */}
          <div className="payment-account-verified-card-note">
            <Landmark size={16} />
            <span>Account details are validated for format only. The bank has not verified the account holder's name.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
