import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Button,
  TextField,
} from "@mui/material";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  FileUp,
  Globe2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";

import { getAccessToken, setAccessToken } from "../../constants/authStorage";
import api from "../../services/api";
import { orgService } from "../../services/admin/organization.service";
import { orgVerificationService } from "../../services/admin/org-verification.service";
import { uploadService } from "../../services/admin/uploadCloud";
import { triggerNotification } from "../../hooks/notification/useNotificationTrigger";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import type { PayloadOrganizationDto } from "../../types/organization/create";
import {
  buildIndustryValue,
  INDUSTRY_OTHER_VALUE,
} from "../../constants/industryOptions";
import IndustryMultiSelect from "../../components/common/IndustryMultiSelect";
import "../../styles/auth/login.css";
import "../../styles/auth/org-register.css";

const initialForm = {
  name: "",
  slug: "",
  legalName: "",
  industry: "",
  address: "",
  email: "",
  phone: "",
  website: "",
  bio: "",
};

const initialVerification = {
  taxIdNumber: "",
  documentUrl: "",
};

const STEPS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Verification" },
  { id: 3, label: "Confirm" },
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getCreatedOrgId(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;

  const payload = response as Record<string, any>;
  return (
    payload.id ||
    payload.data?.id ||
    payload.data?.organization?.id ||
    payload.data?.item?.id ||
    payload.organization?.id ||
    null
  );
}

function getUploadedDocumentUrl(response: unknown): string | null {
  if (!response) return null;
  if (typeof response === "string") return response;

  const payload = response as any;
  if (typeof payload.data === "string") return payload.data;

  return (
    payload.secure_url ||
    payload.url ||
    payload.imageUrl ||
    payload.documentUrl ||
    payload.fileUrl ||
    payload.location ||
    payload.Location ||
    payload.path ||
    payload.data?.secure_url ||
    payload.data?.url ||
    payload.data?.imageUrl ||
    payload.data?.documentUrl ||
    payload.data?.fileUrl ||
    payload.data?.location ||
    payload.data?.Location ||
    payload.data?.path ||
    null
  );
}

export default function OrgRegisterPage() {
  const navigate = useNavigate();
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [verification, setVerification] = useState(initialVerification);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [otherIndustry, setOtherIndustry] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState("");
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");
  const [isSkippingVerification, setIsSkippingVerification] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUser = useMemo(() => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<JwtPayloadCustom>(token);
    } catch {
      return null;
    }
  }, []);

  const industry = buildIndustryValue(selectedIndustries, otherIndustry);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" ? { slug: toSlug(value) } : {}),
    }));
  };

  const updateVerification = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setVerification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectFile = (file: File) => {
    if (!file) return;

    const isValidType =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isValidType) {
      toast.error("Please upload an image file (PNG, JPG, WebP) or PDF document.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(documentPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setDocumentFile(file);
    setDocumentFileName(file.name);
    setDocumentPreviewUrl(previewUrl);
    setUploadedDocUrl("");
    toast.success("Verification document selected.");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleSelectFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelectFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleSelectFile(file);
          break;
        }
      }
    }
  };

  const handleRemoveDocument = () => {
    if (documentPreviewUrl && documentPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setDocumentFile(null);
    setDocumentFileName("");
    setDocumentPreviewUrl("");
    setUploadedDocUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateBasicInfo = () => {
    if (!form.name.trim() || !industry) {
      toast.warning("Please fill the organization name and industry.");
      return false;
    }

    return true;
  };

  const validateVerification = () => {
    if (!verification.taxIdNumber.trim()) {
      toast.warning("Please enter your business tax ID number.");
      return false;
    }

    if (!documentFile && !documentPreviewUrl) {
      toast.warning("Please upload at least one verification proof document.");
      return false;
    }

    return true;
  };

  const createOrganization = async () => {
    if (!currentUser?.sub) {
      toast.error("Please login before registering an organization.");
      navigate("/login");
      return null;
    }

    const payload: PayloadOrganizationDto = {
      ...form,
      name: form.name.trim(),
      slug: form.slug || toSlug(form.name),
      ownerId: currentUser.sub,
      industry,
      bio: form.bio.trim() || null,
    };

    return orgService.createOrg(payload);
  };

  const handleSubmitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    if (!validateBasicInfo()) {
      setStep(1);
      return;
    }

    if (!isSkippingVerification && !validateVerification()) {
      setStep(2);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing organization registration...");

    try {
      // ==========================================
      // BƯỚC 1: Gọi API tạo Organization (Lấy ID)
      // Tái sử dụng createdOrgId nếu bước này đã thành công ở lần thử trước
      // ==========================================
      let orgId = createdOrgId;
      if (!orgId) {
        toast.update(toastId, { render: "Creating organization profile..." });
        const orgResponse = await createOrganization();
        orgId = getCreatedOrgId(orgResponse);

        if (!orgId) {
          throw new Error("Failed to create organization profile. Please try again.");
        }
        setCreatedOrgId(orgId);

        // Cập nhật access token mới nếu có trong orgResponse
        const newAccessToken =
          (orgResponse as any)?.accessToken || (orgResponse as any)?.data?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }

        // Thử refresh token ngầm để nhận role/permissions mới cho tổ chức vừa tạo
        try {
          const refreshRes = await api.post(
            "/auth/refresh",
            {},
            // @ts-expect-error skip toast if refresh not supported
            { withCredentials: true, skipGlobalToast: true }
          );
          const refreshedToken =
            refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
          if (refreshedToken) {
            setAccessToken(refreshedToken);
          }
        } catch {
          // Bỏ qua nếu refresh chưa khả dụng
        }

        await triggerNotification("ORG_CREATED", { orgName: form.name });
      }

      // Nếu người dùng chọn bỏ qua xác thực thì kết thúc tại đây
      if (isSkippingVerification) {
        toast.update(toastId, {
          render: "Organization registered successfully! Redirecting...",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
        navigate("/app/organizations");
        return;
      }

      // ==========================================
      // BƯỚC 2: Gọi API Upload Image (Lấy documentUrl)
      // Tái sử dụng uploadedDocUrl nếu đã upload thành công trước đó
      // ==========================================
      let docUrl = uploadedDocUrl;
      if (!docUrl) {
        if (documentFile) {
          toast.update(toastId, { render: "Uploading verification document to cloud..." });
          const formData = new FormData();
          formData.append("file", documentFile);

          const uploadResponse = await uploadService.upload(formData);
          docUrl = getUploadedDocumentUrl(uploadResponse) || "";

          if (!docUrl) {
            throw new Error("Failed to upload verification document. Please try again.");
          }
          setUploadedDocUrl(docUrl);
        } else if (documentPreviewUrl && !documentPreviewUrl.startsWith("blob:")) {
          docUrl = documentPreviewUrl;
          setUploadedDocUrl(docUrl);
        } else {
          throw new Error("Verification proof document is missing. Please upload a document.");
        }
      }

      // ==========================================
      // BƯỚC 3: Gọi API tạo Verification
      // Body chuẩn: { organizationId, taxIdNumber, documentUrl }
      // ==========================================
      toast.update(toastId, { render: "Submitting verification request..." });
      try {
        await orgVerificationService.create(
          {
            organizationId: orgId,
            taxIdNumber: verification.taxIdNumber.trim(),
            documentUrl: docUrl,
          },
          { skipGlobalToast: true }
        );

        await triggerNotification("ORG_VERIFICATION_SUBMITTED", {
          orgName: form.name,
        });

        toast.update(toastId, {
          render: "Organization registered and verification submitted successfully! Redirecting...",
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });

        navigate("/app/organizations");
      } catch (verifError: any) {
        const verifMsg =
          verifError?.response?.data?.message ||
          verifError?.message ||
          "Failed to submit verification request.";
        const displayVerifMsg = Array.isArray(verifMsg) ? verifMsg[0] : verifMsg;

        toast.update(toastId, {
          render: `Organization created, but verification failed: ${displayVerifMsg}. You can retry or complete verification later in organization settings.`,
          type: "warning",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      }
    } catch (error: any) {
      // Tuyệt đối không gọi lệnh xóa của Admin ở trang đăng ký của user
      const message = error?.response?.data?.message || error?.message;
      const displayMessage = Array.isArray(message)
        ? message[0]
        : message || "Organization registration failed. Please try again.";

      toast.update(toastId, {
        render: displayMessage,
        type: "error",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const goToVerification = () => {
    if (validateBasicInfo()) setStep(2);
  };

  const goToConfirm = () => {
    if (validateVerification()) {
      setIsSkippingVerification(false);
      setStep(3);
    }
  };

  const handleSkipVerification = () => {
    setIsSkippingVerification(true);
    setStep(3);
  };

  return (
    <main className="org-onboarding-page login-theme--light">
      <div className="org-onboarding-container">
        <Link to="/app/organizations" className="org-onboarding-back">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to organizations
        </Link>

        <section className="org-onboarding-shell" aria-label="Register organization">
          <aside className="org-onboarding-aside">
            <div className="org-onboarding-brand">
              <img src="/logo-event.png" alt="Eventix" />
              <div>
                <strong>Eventix</strong>
                <span>Organizer Onboarding</span>
              </div>
            </div>

            <div className="org-onboarding-copy">
              <span className="org-onboarding-eyebrow">
                Build a trusted community
              </span>
              <h1>Launch your organization workspace.</h1>
              <p>
                Create an organizer profile, add contact details, and request
                verification when your community is ready to host on Eventix.
              </p>
            </div>

            <div className="org-onboarding-trust" aria-label="Onboarding benefits">
              <div>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Verified organizer flow</span>
              </div>
              <div>
                <Building2 size={18} aria-hidden="true" />
                <span>Public profile ready</span>
              </div>
              <div>
                <FileCheck2 size={18} aria-hidden="true" />
                <span>Document review supported</span>
              </div>
            </div>
          </aside>

        <section className="org-onboarding-form-area">
          <header className="org-onboarding-header">
            <span>Step {step} of {STEPS.length}</span>
            <h2>Register organization</h2>
            <p>Complete the sections below to submit your organizer profile.</p>
          </header>

          <nav className="org-stepper" aria-label="Registration steps">
            <ol className="org-stepper__list">
              {STEPS.map((item, index) => {
                const isComplete = step > item.id;
                const isActive = step === item.id;
                const stateClass = isComplete
                  ? "is-complete"
                  : isActive
                  ? "is-active"
                  : "is-upcoming";

                return (
                  <li
                    className={`org-stepper__item ${stateClass} ${isComplete ? "is-clickable" : ""}`}
                    key={item.id}
                  >
                    <div
                      className="org-stepper__node"
                      onClick={() => {
                        if (isComplete && !loading) setStep(item.id);
                      }}
                      role={isComplete ? "button" : undefined}
                      tabIndex={isComplete ? 0 : undefined}
                    >
                      <div className="org-stepper__circle">
                        {isComplete ? (
                          <Check size={14} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <span>{item.id}</span>
                        )}
                      </div>
                      <span className="org-stepper__label">{item.label}</span>
                    </div>

                    {index < STEPS.length - 1 && (
                      <div
                        className={`org-stepper__line ${
                          step > item.id ? "is-filled" : ""
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <form className="org-onboarding-form" onSubmit={handleSubmitRegistration}>
            {step === 1 && (
              <div className="org-onboarding-panel">
                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <h3>Organization Information</h3>
                      <p>Name, category, and a short intro for your public page.</p>
                    </div>
                  </div>

                  <div className="org-onboarding-grid">
                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-name">
                        Organization name <span className="org-required">*</span>
                      </label>
                      <TextField
                        id="org-field-name"
                        className="org-onboarding-field"
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        placeholder="Google Vietnam"
                        fullWidth
                      />
                    </div>

                    <div className="org-onboarding-field-group">
                      <label className="org-onboarding-label" htmlFor="org-field-slug">
                        Slug
                      </label>
                      <TextField
                        id="org-field-slug"
                        className="org-onboarding-field"
                        name="slug"
                        value={form.slug}
                        placeholder="auto-generated"
                        fullWidth
                        slotProps={{ input: { readOnly: true } }}
                      />
                    </div>

                    <div className="org-onboarding-field-group">
                      <label className="org-onboarding-label">
                        Industry <span className="org-required">*</span>
                      </label>
                      <IndustryMultiSelect
                        selected={selectedIndustries}
                        onChange={setSelectedIndustries}
                      />
                    </div>

                    {selectedIndustries.includes(INDUSTRY_OTHER_VALUE) && (
                      <div className="org-onboarding-field-group org-onboarding-field--wide">
                        <label className="org-onboarding-label" htmlFor="org-field-other-industry">
                          Other industry <span className="org-required">*</span>
                        </label>
                        <TextField
                          id="org-field-other-industry"
                          className="org-onboarding-field"
                          value={otherIndustry}
                          onChange={(event) => setOtherIndustry(event.target.value)}
                          placeholder="Enter industry"
                          fullWidth
                        />
                      </div>
                    )}

                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-bio">
                        Description
                      </label>
                      <TextField
                        id="org-field-bio"
                        className="org-onboarding-field"
                        name="bio"
                        value={form.bio}
                        onChange={updateField}
                        placeholder="Tell attendees what your organization does..."
                        multiline
                        minRows={3}
                        fullWidth
                      />
                    </div>
                  </div>
                </section>

                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <Globe2 size={18} />
                    </span>
                    <div>
                      <h3>Brand Information</h3>
                      <p>Use official naming now. Logo/banner can be updated after approval.</p>
                    </div>
                  </div>

                  <div className="org-onboarding-grid">
                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-legalName">
                        Legal name
                      </label>
                      <TextField
                        id="org-field-legalName"
                        className="org-onboarding-field"
                        name="legalName"
                        value={form.legalName}
                        onChange={updateField}
                        placeholder="Legal business name"
                        fullWidth
                      />
                    </div>

                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-website">
                        Website
                      </label>
                      <TextField
                        id="org-field-website"
                        className="org-onboarding-field"
                        name="website"
                        type="url"
                        value={form.website}
                        onChange={updateField}
                        placeholder="https://example.com"
                        fullWidth
                      />
                    </div>
                  </div>
                </section>

                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <Mail size={18} />
                    </span>
                    <div>
                      <h3>Contact</h3>
                      <p>Where Eventix and attendees can reach your team.</p>
                    </div>
                  </div>

                  <div className="org-onboarding-grid">
                    <div className="org-onboarding-field-group">
                      <label className="org-onboarding-label" htmlFor="org-field-email">
                        Email
                      </label>
                      <TextField
                        id="org-field-email"
                        className="org-onboarding-field"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="contact@example.com"
                        fullWidth
                      />
                    </div>

                    <div className="org-onboarding-field-group">
                      <label className="org-onboarding-label" htmlFor="org-field-phone">
                        Phone
                      </label>
                      <TextField
                        id="org-field-phone"
                        className="org-onboarding-field"
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="+84 900 000 000"
                        fullWidth
                      />
                    </div>

                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-address">
                        Address
                      </label>
                      <TextField
                        id="org-field-address"
                        className="org-onboarding-field"
                        name="address"
                        value={form.address}
                        onChange={updateField}
                        placeholder="Business address"
                        fullWidth
                      />
                    </div>
                  </div>
                </section>

                <footer className="org-onboarding-actions org-onboarding-actions--end">
                  <Button
                    type="button"
                    variant="contained"
                    className="org-onboarding-button org-onboarding-button--primary"
                    onClick={goToVerification}
                  >
                    Continue
                  </Button>
                </footer>
              </div>
            )}

            {step === 2 && (
              <div className="org-onboarding-panel">
                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <h3>Business Verification</h3>
                      <p>
                        Optional review for organizations that want a trusted
                        verification badge.
                      </p>
                    </div>
                  </div>

                  <div className="org-onboarding-callout">
                    <div>
                      <strong>Verified Eventix community host</strong>
                      <p>
                        We review tax information and official business
                        documents before marking an organization as verified.
                      </p>
                    </div>
                    <span>Optional</span>
                  </div>
                </section>

                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <FileCheck2 size={18} />
                    </span>
                    <div>
                      <h3>Verification Documents</h3>
                      <p>
                        Please review the required document categories below before uploading your verification proof.
                      </p>
                    </div>
                  </div>

                  <div className="org-doc-guidelines">
                    <div className="org-doc-guide-card org-doc-guide-card--required">
                      <div className="org-doc-guide-card__header">
                        <div className="org-doc-guide-card__title-wrap">
                          <span className="org-doc-guide-card__badge org-doc-guide-card__badge--required">
                            Required (Core)
                          </span>
                          <h4>Business Registration Certificate / Enterprise License</h4>
                        </div>
                      </div>
                      <p className="org-doc-guide-card__desc">
                        Including the official Tax ID Number (MST) to prove basic legal entity status.
                      </p>
                    </div>

                    <div className="org-doc-guide-card org-doc-guide-card--optional">
                      <div className="org-doc-guide-card__header">
                        <div className="org-doc-guide-card__title-wrap">
                          <span className="org-doc-guide-card__badge org-doc-guide-card__badge--optional">
                            Supporting Documents (Optional)
                          </span>
                          <h4>Additional Verification & Authorization Documents</h4>
                        </div>
                      </div>
                      <p className="org-doc-guide-card__desc">
                        Tax registration certificate, sub-licenses, representative ID, or power of attorney (used for in-depth verification or delegated administration).
                      </p>
                    </div>
                  </div>
                </section>

                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <span className="org-onboarding-section__icon" aria-hidden="true">
                      <Upload size={18} />
                    </span>
                    <div>
                      <h3>Verification Details</h3>
                      <p>Add tax number and official proof document for review.</p>
                    </div>
                  </div>

                  <div className="org-onboarding-grid">
                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label" htmlFor="org-field-taxIdNumber">
                        Tax number <span className="org-required">*</span>
                      </label>
                      <TextField
                        id="org-field-taxIdNumber"
                        className="org-onboarding-field"
                        name="taxIdNumber"
                        value={verification.taxIdNumber}
                        onChange={updateVerification}
                        placeholder="0312345678"
                        fullWidth
                      />
                    </div>

                    <div className="org-onboarding-field-group org-onboarding-field--wide">
                      <label className="org-onboarding-label">
                        Verification document <span className="org-required">*</span>
                      </label>

                      <div
                        className="org-uploader"
                        onPaste={handlePaste}
                        tabIndex={0}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="org-uploader__input"
                          onChange={handleFileChange}
                          disabled={loading}
                        />

                        {documentFile && documentPreviewUrl ? (
                          <div className="org-uploader__preview-card">
                            <div className="org-uploader__preview-info">
                              {documentFile.type.startsWith("image/") ? (
                                <img
                                  src={documentPreviewUrl}
                                  alt="Uploaded document preview"
                                  className="org-uploader__thumb"
                                />
                              ) : (
                                <div className="org-uploader__doc-icon" aria-hidden="true">
                                  <FileText size={24} />
                                </div>
                              )}
                              <div className="org-uploader__meta">
                                <span
                                  className="org-uploader__filename"
                                  title={documentFileName}
                                >
                                  {documentFileName}
                                </span>
                                <span className="org-uploader__status">
                                  <CircleCheck size={14} /> Selected & ready for review
                                </span>
                              </div>
                            </div>

                            <div className="org-uploader__actions">
                              <button
                                type="button"
                                className="org-uploader__btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Replace document"
                              >
                                <RefreshCw size={13} />
                                Change
                              </button>
                              <button
                                type="button"
                                className="org-uploader__btn org-uploader__btn--remove"
                                onClick={handleRemoveDocument}
                                title="Remove document"
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`org-uploader__dropzone ${isDragging ? "is-dragging" : ""}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="org-uploader__icon" aria-hidden="true">
                              <FileUp size={22} />
                            </div>
                            <div className="org-uploader__title">
                              <span>Click to upload</span> or drag and drop
                            </div>
                            <p className="org-uploader__hint">
                              PNG, JPG, PDF up to 10MB • or paste image from clipboard (Ctrl+V)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <footer className="org-onboarding-actions">
                  <Button
                    type="button"
                    variant="outlined"
                    className="org-onboarding-button org-onboarding-button--secondary"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <div className="org-onboarding-actions__group">
                    <Button
                      type="button"
                      className="org-onboarding-button org-onboarding-button--ghost"
                      onClick={handleSkipVerification}
                      disabled={loading}
                    >
                      Skip verification
                    </Button>
                    <Button
                      type="button"
                      variant="contained"
                      className="org-onboarding-button org-onboarding-button--primary"
                      onClick={goToConfirm}
                      disabled={loading}
                    >
                      Verify identity
                    </Button>
                  </div>
                </footer>
              </div>
            )}

            {step === 3 && (
              <div className="org-onboarding-panel">
                <section className="org-onboarding-section">
                  <div className="org-onboarding-section__head">
                    <Check size={19} aria-hidden="true" />
                    <div>
                      <h3>Confirm Registration</h3>
                      <p>Review your organization information one more time.</p>
                    </div>
                  </div>

                  <div className="org-onboarding-summary">
                    <div>
                      <h4>Organization profile</h4>
                      <dl>
                        <div>
                          <dt>Name</dt>
                          <dd>{form.name || "-"}</dd>
                        </div>
                        <div>
                          <dt>Slug</dt>
                          <dd>{form.slug || "-"}</dd>
                        </div>
                        <div>
                          <dt>Industry</dt>
                          <dd>{industry || "-"}</dd>
                        </div>
                        <div>
                          <dt>Legal name</dt>
                          <dd>{form.legalName || "-"}</dd>
                        </div>
                        <div>
                          <dt>Email</dt>
                          <dd>{form.email || "-"}</dd>
                        </div>
                        <div>
                          <dt>Phone</dt>
                          <dd>{form.phone || "-"}</dd>
                        </div>
                        <div>
                          <dt>Address</dt>
                          <dd>{form.address || "-"}</dd>
                        </div>
                        <div>
                          <dt>Website</dt>
                          <dd>{form.website || "-"}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4>Verification request</h4>
                      {isSkippingVerification ? (
                        <p className="org-onboarding-summary__skipped">
                          Verification skipped (You can submit your verification request later).
                        </p>
                      ) : (
                        <dl>
                          <div>
                            <dt>Tax number</dt>
                            <dd>{verification.taxIdNumber || "-"}</dd>
                          </div>
                          <div>
                            <dt>Uploaded document</dt>
                            <dd>
                              {documentPreviewUrl ? (
                                <a
                                  href={documentPreviewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="org-onboarding-doc-link"
                                  title="Click to view document in a new tab"
                                >
                                  <FileText size={15} />
                                  <span>{documentFileName || "Verification document"}</span>
                                  <ExternalLink size={13} />
                                </a>
                              ) : (
                                <span>-</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      )}
                    </div>
                  </div>
                </section>

                <footer className="org-onboarding-actions">
                  <Button
                    type="button"
                    variant="outlined"
                    className="org-onboarding-button org-onboarding-button--secondary"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    className={`org-onboarding-button org-onboarding-button--primary ${loading ? "is-loading" : ""}`}
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      "Submit registration"
                    )}
                  </Button>
                </footer>
              </div>
            )}
          </form>
        </section>
      </section>
      </div>
    </main>
  );
}
