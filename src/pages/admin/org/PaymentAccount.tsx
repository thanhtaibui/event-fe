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
  if (!acc) return "Chưa cấu hình";
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
      return "Yêu cầu hết thời gian chờ (timeout). Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
    if (err?.message === "Network Error" || (err?.message && err.message.toLowerCase().includes("network"))) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền internet.";
    }
    return "Không nhận được phản hồi từ máy chủ. Vui lòng thử lại sau.";
  }

  const status = err.response.status;
  const data = err.response.data;
  const code = (data?.code || data?.errorCode || "").toString().toUpperCase();
  const rawMsg = Array.isArray(data?.message)
    ? data.message.join("; ")
    : (data?.message || data?.error || "");
  const upperRaw = rawMsg.toString().toUpperCase();

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
  }
  if (status === 403) {
    return "Bạn không có quyền quản lý tài khoản thanh toán của tổ chức này.";
  }
  if (code === "BANK_BIN_REQUIRED" || upperRaw.includes("BANK_BIN_REQUIRED")) {
    return "Vui lòng chọn ngân hàng thụ hưởng (mã BIN ngân hàng là bắt buộc).";
  }
  if (code === "BANK_UNSUPPORTED" || upperRaw.includes("BANK_UNSUPPORTED")) {
    return "Ngân hàng này hiện chưa được hỗ trợ liên kết thanh toán.";
  }
  if (code === "INVALID_BANK_ACCOUNT" || upperRaw.includes("INVALID_BANK_ACCOUNT")) {
    return "Định dạng số tài khoản ngân hàng không hợp lệ (gồm từ 6 đến 19 chữ số).";
  }
  if (code === "ACCOUNT_HOLDER_NAME_REQUIRED" || upperRaw.includes("ACCOUNT_HOLDER_NAME_REQUIRED")) {
    return "Vui lòng nhập tên chủ tài khoản.";
  }
  if (code === "INVALID_ACCOUNT_NAME" || upperRaw.includes("INVALID_ACCOUNT_NAME")) {
    return "Tên chủ tài khoản không hợp lệ (không được để trống và tối đa 120 ký tự).";
  }
  if (rawMsg && rawMsg.includes("Cannot change receiving account while payments are pending")) {
    return "Không thể thay đổi tài khoản nhận tiền khi đang có giao dịch thanh toán chờ xử lý.";
  }
  if (status === 400) {
    return rawMsg || "Dữ liệu tài khoản không hợp lệ. Vui lòng kiểm tra lại thông tin.";
  }
  if (status >= 500) {
    return rawMsg && !rawMsg.toLowerCase().includes("internal server error")
      ? rawMsg
      : "Máy chủ gặp sự cố khi lưu tài khoản thanh toán. Vui lòng thử lại sau.";
  }
  return rawMsg || "Không thể lưu tài khoản thanh toán.";
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
        setFetchError("Bạn không có quyền xem thông tin tài khoản thanh toán của tổ chức này.");
      } else {
        setFetchError(err?.response?.data?.message || "Không thể tải thông tin tài khoản thanh toán.");
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
      errors.bankBin = "Vui lòng chọn hoặc nhập mã BIN ngân hàng gồm 6 chữ số.";
    } else if (!/^\d{6}$/.test(effectiveBin)) {
      errors.bankBin = "Mã BIN ngân hàng phải gồm đúng 6 chữ số theo chuẩn NAPAS.";
    }

    if (isCustomBank && !effectiveBankName) {
      errors.bankName = "Vui lòng nhập tên ngân hàng.";
    }

    const cleanAccNum = accountNumber.trim();
    if (!cleanAccNum) {
      errors.accountNumber = "Vui lòng nhập số tài khoản ngân hàng thụ hưởng.";
    } else if (!/^\d{6,19}$/.test(cleanAccNum)) {
      errors.accountNumber = "Số tài khoản ngân hàng không hợp lệ (gồm từ 6 đến 19 chữ số).";
    }

    const cleanHolderName = accountHolderName.trim().replace(/\s+/g, " ");
    if (!cleanHolderName) {
      errors.accountHolderName = "Vui lòng nhập tên chủ tài khoản.";
    } else if (cleanHolderName.length < 2 || cleanHolderName.length > 120) {
      errors.accountHolderName = "Tên chủ tài khoản phải có độ dài từ 2 đến 120 ký tự.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isConfigured = Boolean(
    accountData && (accountData.bankBin || accountData.accountNumber || accountData.accountName)
  );

  // Trạng thái tài khoản phản ánh trung thực từ Backend
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

  // Single Save Action: Validate cơ bản và lưu trực tiếp tài khoản theo Backend API contract mới
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!canManage) {
      toast.error("Bạn không có quyền quản lý tài khoản thanh toán của tổ chức này.");
      return;
    }

    if (!organizationId) {
      toast.error("Không xác định được mã định danh tổ chức.");
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
      };

      const res = await orgService.updatePaymentAccount(organizationId, payload);
      setAccountData(res);
      setAccountNumber("");
      if (res.accountHolderName || res.accountName) {
        setAccountHolderName(res.accountHolderName || res.accountName || cleanHolderName);
      }
      setSaveSuccess(true);
      toast.success("Lưu tài khoản thanh toán thành công.");
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
    if (!accountData) return "Chưa cấu hình";
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
          <p>Đang tải thông tin tài khoản thanh toán...</p>
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
          <h2>Truy cập bị giới hạn</h2>
          <p>
            Chỉ <strong>Chủ tổ chức (Owner)</strong> hoặc thành viên được cấp quyền quản lý thanh toán
            mới có thể cấu hình tài khoản nhận tiền.
          </p>
          <Link to={`/org/${slug}/dashboard`} className="payment-account-btn payment-account-btn--secondary">
            Quay lại Dashboard
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
            Cài đặt thanh toán tổ chức
          </span>
          <h1>Tài khoản thanh toán VietQR</h1>
          <p>
            Cấu hình tài khoản ngân hàng nhận tiền của tổ chức để tự động tạo mã Napas247 VietQR khi người tham dự mua vé sự kiện.
          </p>
        </div>
        <div className="payment-account-hero__actions">
          <button
            type="button"
            className="payment-account-btn payment-account-btn--outline"
            onClick={fetchPaymentAccount}
            disabled={loading || saving}
            title="Tải lại dữ liệu từ máy chủ"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Làm mới
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
            <strong>Tài khoản chưa thể xác minh</strong>
            <p>
              {accountData.verificationFailureReason ||
                "Thông tin tài khoản thụ hưởng không hợp lệ hoặc bị ngân hàng từ chối. Vui lòng kiểm tra và cập nhật lại."}
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
            <strong>Đã lưu tài khoản thanh toán thành công.</strong>
            <p>
              Tài khoản của chủ sở hữu <strong>{accountData?.accountHolderName || accountData?.accountName || accountHolderName}</strong> tại ngân hàng <strong>{accountData?.bankName || currentSelectedBank?.name || "ngân hàng đã chọn"}</strong> đã được lưu trữ.
              <span className="payment-account-verified-at"> · Ghi chú: Tài khoản được kiểm tra định dạng; tên chủ tài khoản chưa được ngân hàng xác minh.</span>
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
      <section className="payment-account-stats" aria-label="Tóm tắt tài khoản thanh toán">
        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Trạng thái xác thực</span>
          <div className="payment-account-stat-card__value">
            {effectiveVerificationStatus === "VERIFIED" ? (
              <span className="payment-account-badge payment-account-badge--success">
                <ShieldCheck size={14} /> Đã xác minh
              </span>
            ) : effectiveVerificationStatus === "FAILED" ? (
              <span className="payment-account-badge payment-account-badge--danger">
                <XCircle size={14} /> Xác minh thất bại
              </span>
            ) : isConfigured ? (
              <span className="payment-account-badge payment-account-badge--pending">
                <Clock size={14} /> Chưa được ngân hàng xác minh
              </span>
            ) : (
              <span className="payment-account-badge payment-account-badge--warning">
                <AlertTriangle size={14} /> Chưa cấu hình
              </span>
            )}
          </div>
          <small className="payment-account-stat-card__sub">
            {effectiveVerificationStatus === "VERIFIED"
              ? "Sẵn sàng nhận thanh toán VietQR"
              : effectiveVerificationStatus === "FAILED"
              ? "Tài khoản bị ngân hàng từ chối"
              : isConfigured
              ? "Tài khoản được kiểm tra định dạng; tên chủ tài khoản chưa được ngân hàng xác minh."
              : "Cần thiết lập để kích hoạt VietQR"}
          </small>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Ngân hàng thụ hưởng</span>
          <div className="payment-account-stat-card__bank-row">
            {accountData?.bankBin && getBankByBin(accountData.bankBin)?.logo ? (
              <div className="payment-account-stat-card__logo-wrap">
                <img
                  src={getBankByBin(accountData.bankBin)!.logo}
                  alt={accountData?.bankName || "Logo ngân hàng"}
                  className="payment-account-stat-card__logo"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="payment-account-stat-card__bank-texts">
              <strong className="payment-account-stat-card__title">
                {accountData?.bankName || "Chưa cấu hình"}
              </strong>
              <small className="payment-account-stat-card__sub">
                {accountData?.bankBin ? `Mã BIN: ${accountData.bankBin}` : "Chưa chọn ngân hàng"}
              </small>
            </div>
          </div>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Số tài khoản (Che một phần)</span>
          <strong className="payment-account-stat-card__title payment-account-stat-card__title--mono">
            {displayMaskedAcc}
          </strong>
          <small className="payment-account-stat-card__sub">Che một phần theo dữ liệu hệ thống</small>
        </article>

        <article className="payment-account-stat-card">
          <span className="payment-account-stat-card__label">Tên chủ tài khoản</span>
          <strong className="payment-account-stat-card__title">
            {accountData?.accountHolderName || accountData?.accountName || "Chưa cấu hình"}
          </strong>
          <small className="payment-account-stat-card__sub">
            {effectiveVerificationStatus === "VERIFIED"
              ? "Đã xác minh bởi ngân hàng"
              : isConfigured
              ? "Chưa được ngân hàng xác minh"
              : "Chưa cấu hình"}
          </small>
        </article>
      </section>

      {/* 5. FORM & LIVE PREVIEW GRID */}
      <div className="payment-account-grid">
        {/* LEFT COLUMN: FORM */}
        <section className="payment-account-panel">
          <div className="payment-account-panel__header">
            <div>
              <h2>{isConfigured ? "Cập nhật tài khoản nhận tiền" : "Thiết lập tài khoản nhận tiền"}</h2>
              <p>Nhập thông tin tài khoản ngân hàng thụ hưởng nhận tiền vé sự kiện qua VietQR.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="payment-account-form" noValidate>
            {/* Field: Beneficiary Bank Picker with Logo & Search */}
            <div className="payment-account-field" ref={bankPickerRef}>
              <label>
                Ngân hàng thụ hưởng <span className="req">*</span>
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
                        <span className="bank-picker-bin-badge">BIN: {currentSelectedBank.bin}</span>
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
                        <strong>{customBankName || "Ngân hàng khác"}</strong>
                        <span className="bank-picker-bin-badge">
                          BIN: {customBankBin || "Chưa nhập"}
                        </span>
                      </div>
                      <small className="bank-picker-trigger__desc">Nhập thủ công tên ngân hàng và mã BIN Napas</small>
                    </div>
                  </div>
                ) : (
                  <div className="bank-picker-trigger__placeholder">
                    <Landmark size={18} />
                    <span>-- Chọn ngân hàng trong hệ thống Napas247 (23+ ngân hàng) --</span>
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
                      placeholder="Tìm theo tên ngân hàng, mã viết tắt (MB, VCB, TCB), hoặc BIN..."
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
                              <span className="bank-picker-item__bin">BIN {bank.bin}</span>
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
                        <p>Không tìm thấy ngân hàng nào khớp với "{bankSearchQuery}"</p>
                      </div>
                    )}
                  </div>

                  {/* Option: Other Bank */}
                  <div className="bank-picker-footer" onClick={handleSelectCustomBank}>
                    <div className="bank-picker-logo-container bank-picker-logo-container--custom">
                      <Building size={18} />
                    </div>
                    <div className="bank-picker-footer__text">
                      <strong>Ngân hàng khác</strong>
                      <small>Nhập thủ công tên ngân hàng và mã BIN NAPAS 6 số</small>
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
                    Tên ngân hàng <span className="req">*</span>
                  </label>
                  <input
                    id="customBankName"
                    type="text"
                    placeholder="VD: Kienlongbank"
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
                    Mã BIN NAPAS (6 chữ số) <span className="req">*</span>
                  </label>
                  <input
                    id="customBankBin"
                    type="text"
                    maxLength={6}
                    placeholder="VD: 970452"
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
                Số tài khoản ngân hàng <span className="req">*</span>
              </label>
              <input
                id="accountNumber"
                type="text"
                maxLength={19}
                placeholder={
                  isConfigured
                    ? `Hiện tại: ${displayMaskedAcc} (Nhập số mới để thay đổi)`
                    : "Nhập số tài khoản ngân hàng (6 - 19 chữ số)"
                }
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
              <span className="field-hint">
                Chỉ gồm chữ số, từ 6 đến 19 ký tự, không bao gồm khoảng trắng hay ký tự đặc biệt.
              </span>
              {formErrors.accountNumber && (
                <span className="field-error">{formErrors.accountNumber}</span>
              )}
            </div>

            {/* Account Holder Name */}
            <div className="payment-account-field">
              <label htmlFor="accountHolderName">
                Tên chủ tài khoản <span className="req">*</span>
              </label>
              <input
                id="accountHolderName"
                type="text"
                maxLength={120}
                placeholder="VD: NGUYEN VAN A"
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
              <span className="field-hint">
                Nhập tên chủ tài khoản theo đăng ký tại ngân hàng.
              </span>
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

            {/* Actions: Chỉ giữ một nút Lưu tài khoản */}
            <div className="payment-account-form-actions">
              <button
                type="submit"
                className="payment-account-btn payment-account-btn--primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Đang lưu tài khoản...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Lưu tài khoản
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
                Hủy thay đổi
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
                    <ShieldCheck size={11} /> Đã xác minh
                  </span>
                ) : effectiveVerificationStatus === "FAILED" ? (
                  <span className="card-preview-indicator card-preview-indicator--failed">
                    <XCircle size={11} /> Thất bại
                  </span>
                ) : isConfigured ? (
                  <span className="card-preview-indicator card-preview-indicator--pending">
                    <Clock size={11} /> Chưa xác minh
                  </span>
                ) : (
                  <span className="card-preview-indicator card-preview-indicator--unverified">
                    Chưa cấu hình
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
                    alt="Logo ngân hàng"
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
                  ? customBankName || "NGÂN HÀNG"
                  : currentSelectedBank?.name ||
                    accountData?.bankName ||
                    "CHỌN NGÂN HÀNG"}
              </span>
            </div>

            <div className="payment-account-card-preview__number">
              {accountNumber
                ? maskAccountNumber(accountNumber)
                : displayMaskedAcc !== "Chưa cấu hình"
                ? displayMaskedAcc
                : "•••• •••• •••• ••••"}
            </div>

            <div className="payment-account-card-preview__bottom">
              <div>
                <small>CHỦ TÀI KHOẢN</small>
                <strong>
                  {accountHolderName ||
                    accountData?.accountHolderName ||
                    accountData?.accountName ||
                    "CHỦ TÀI KHOẢN"}
                </strong>
              </div>
              <div className="payment-account-card-preview__bin">
                <small>MÃ BIN</small>
                <strong>
                  {currentPreviewBin || "------"}
                </strong>
              </div>
            </div>
          </div>

          {/* Note minh bạch theo spec */}
          <div className="payment-account-verified-card-note">
            <Landmark size={16} />
            <span>Tài khoản được kiểm tra định dạng; tên chủ tài khoản chưa được ngân hàng xác minh.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
