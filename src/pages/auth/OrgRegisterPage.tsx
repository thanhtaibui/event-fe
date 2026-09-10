import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  ArrowLeft,
  Building2,
  Check,
  FileCheck2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";

import { getAccessToken } from "../../constants/authStorage";
import { orgService } from "../../services/admin/organization.service";
import { orgVerificationService } from "../../services/admin/org-verification.service";
import { useUpload } from "../../hooks/admin/useUpload";
import { triggerNotification } from "../../hooks/notification/useNotificationTrigger";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import type { PayloadOrganizationDto } from "../../types/organization/create";
import {
  buildIndustryValue,
  INDUSTRY_OTHER_VALUE,
} from "../../constants/industryOptions";
import IndustryMultiSelect from "../../components/common/IndustryMultiSelect";
import "../../styles/auth/login.css";

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
  documentType: "Business registration certificate",
  documentUrl: "",
};

const DOCUMENT_TYPE_OPTIONS = [
  "Business registration certificate",
  "Tax registration certificate",
  "Enterprise license",
  "Organization authorization letter",
  "Government-issued representative ID",
];

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
  const payload = response as any;
  return (
    payload?.secure_url ||
    payload?.url ||
    payload?.imageUrl ||
    payload?.data?.secure_url ||
    payload?.data?.url ||
    payload?.data?.imageUrl ||
    null
  );
}

export default function OrgRegisterPage() {
  const navigate = useNavigate();
  const { upload, loading: uploadingDocument } = useUpload();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [verification, setVerification] = useState(initialVerification);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [otherIndustry, setOtherIndustry] = useState("");
  const [documentInputMode, setDocumentInputMode] = useState<"url" | "file">("url");
  const [documentFileName, setDocumentFileName] = useState("");
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
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setVerification((prev) => ({ ...prev, [name]: value }));
  };

  const uploadVerificationDocument = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "org-verification");

    const response = await upload(formData);
    const documentUrl = getUploadedDocumentUrl(response);

    if (!documentUrl) {
      toast.error("Upload document failed.");
      return;
    }

    setDocumentFileName(file.name);
    setVerification((prev) => ({ ...prev, documentUrl }));
    toast.success("Document uploaded.");
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
      toast.warning("Please enter the tax number.");
      return false;
    }

    if (!verification.documentUrl.trim()) {
      toast.warning("Please add a verification document URL.");
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

  const submitBasicOrganization = async () => {
    if (!validateBasicInfo()) return;

    setLoading(true);
    try {
      await createOrganization();
      toast.success("Organization registration submitted.");
      navigate("/app/organizations");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || "Submit organization failed.");
    } finally {
      setLoading(false);
    }
  };

  const submitVerifiedOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateBasicInfo() || !validateVerification()) return;

    setLoading(true);
    try {
      const response = await createOrganization();
      const organizationId = getCreatedOrgId(response);

      if (!organizationId) {
        toast.error("Organization was created, but verification could not start.");
        return;
      }

      await orgVerificationService.create({
        organizationId,
        taxIdNumber: verification.taxIdNumber.trim(),
        documentUrl: verification.documentUrl.trim(),
      });
      await triggerNotification("ORG_VERIFICATION_SUBMITTED", {
        orgName: form.name,
      });

      toast.success("Organization and verification request submitted.");
      navigate("/app/organizations");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || "Submit organization failed.");
    } finally {
      setLoading(false);
    }
  };

  const goToVerification = () => {
    if (validateBasicInfo()) setStep(2);
  };

  const goToConfirm = () => {
    if (validateVerification()) setStep(3);
  };

  return (
    <main className="org-register-page login-theme--light">
      <Link to="/app/organizations" className="org-register-page__back">
        <ArrowLeft size={17} aria-hidden="true" />
        Back to organizations
      </Link>

      <section className="org-register-card org-register-card--wizard">
        <div className="org-register-card__intro">
          <span className="org-register-card__eyebrow">
            Organization registration
          </span>
          <h1>Create your Eventix community workspace</h1>
          <p>
            Submit your organization profile, choose whether to verify your
            business, then review everything before sending the request.
          </p>
        </div>

        <div className="org-register-workspace">
          <ol className="org-register-steps" aria-label="Registration steps">
            {STEPS.map((item) => (
              <li
                className={`org-register-step ${step === item.id ? "is-active" : ""} ${
                  step > item.id ? "is-complete" : ""
                }`}
                key={item.id}
              >
                <span>{step > item.id ? <Check size={14} /> : item.id}</span>
                <strong>{item.label}</strong>
              </li>
            ))}
          </ol>

          <form className="org-register-form" onSubmit={submitVerifiedOrganization}>
            {step === 1 && (
              <div className="org-register-panel">
                <header className="org-register-panel__header">
                  <span>Step 1</span>
                  <h2>Create organization</h2>
                  <p>Start with your organization profile and contact details.</p>
                </header>

                <section className="org-register-group">
                  <h3>Organization profile</h3>

                  <label className="org-register-field org-register-field--wide">
                    <span>Organization name *</span>
                    <div>
                      <Building2 size={18} aria-hidden="true" />
                      <input
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        placeholder="Google Vietnam"
                        required
                      />
                    </div>
                  </label>

                  <label className="org-register-field">
                    <span>Slug</span>
                    <div>
                      <Globe2 size={18} aria-hidden="true" />
                      <input name="slug" value={form.slug} readOnly />
                    </div>
                  </label>

                  <label className="org-register-field">
                    <span>Industry *</span>
                    <IndustryMultiSelect
                      selected={selectedIndustries}
                      onChange={setSelectedIndustries}
                    />
                  </label>

                  {selectedIndustries.includes(INDUSTRY_OTHER_VALUE) && (
                    <label className="org-register-field org-register-field--wide">
                      <span>Other industry</span>
                      <div>
                        <Building2 size={18} aria-hidden="true" />
                        <input
                          value={otherIndustry}
                          onChange={(event) => setOtherIndustry(event.target.value)}
                          placeholder="Enter industry"
                        />
                      </div>
                    </label>
                  )}

                  <label className="org-register-field org-register-field--wide">
                    <span>Description / Bio</span>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={updateField}
                      rows={4}
                      placeholder="Tell attendees what your organization does..."
                    />
                  </label>
                </section>

                <section className="org-register-group">
                  <h3>Contact & legal information</h3>

                  <label className="org-register-field org-register-field--wide">
                    <span>Legal name</span>
                    <div>
                      <Building2 size={18} aria-hidden="true" />
                      <input
                        name="legalName"
                        value={form.legalName}
                        onChange={updateField}
                        placeholder="Legal business name"
                      />
                    </div>
                  </label>

                  <label className="org-register-field">
                    <span>Email</span>
                    <div>
                      <Mail size={18} aria-hidden="true" />
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </label>

                  <label className="org-register-field">
                    <span>Phone</span>
                    <div>
                      <Phone size={18} aria-hidden="true" />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="+84 900 000 000"
                      />
                    </div>
                  </label>

                  <label className="org-register-field org-register-field--wide">
                    <span>Address</span>
                    <div>
                      <MapPin size={18} aria-hidden="true" />
                      <input
                        name="address"
                        value={form.address}
                        onChange={updateField}
                        placeholder="Business address"
                      />
                    </div>
                  </label>

                  <label className="org-register-field org-register-field--wide">
                    <span>Website</span>
                    <div>
                      <Globe2 size={18} aria-hidden="true" />
                      <input
                        name="website"
                        type="url"
                        value={form.website}
                        onChange={updateField}
                        placeholder="https://example.com"
                      />
                    </div>
                  </label>
                </section>

                <footer className="org-register-actions">
                  <button type="button" className="org-register-btn org-register-btn--primary" onClick={goToVerification}>
                    Continue
                  </button>
                </footer>
              </div>
            )}

            {step === 2 && (
              <div className="org-register-panel">
                <header className="org-register-panel__header">
                  <span>Step 2</span>
                  <h2>Business verification</h2>
                  <p>
                    Verify your identity to request the blue check for this
                    organization. You can skip this and start as a basic
                    organization.
                  </p>
                </header>

                <section className="org-verification-choice">
                  <div>
                    <ShieldCheck size={24} aria-hidden="true" />
                    <strong>Verified Eventix community host</strong>
                    <p>
                      We use business tax information and official documents to
                      review whether the organization is legitimate.
                    </p>
                  </div>
                  <span>Optional</span>
                </section>

                <section className="org-register-group">
                  <h3>Required documents</h3>
                  <div className="org-document-grid">
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <label className="org-document-option" key={option}>
                        <input
                          type="radio"
                          name="documentType"
                          value={option}
                          checked={verification.documentType === option}
                          onChange={updateVerification}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  <label className="org-register-field">
                    <span>Tax number *</span>
                    <div>
                      <FileCheck2 size={18} aria-hidden="true" />
                      <input
                        name="taxIdNumber"
                        value={verification.taxIdNumber}
                        onChange={updateVerification}
                        placeholder="0312345678"
                      />
                    </div>
                  </label>

                  <div className="org-register-field org-register-field--wide">
                    <span>Verification document *</span>
                    <div className="org-document-mode" role="group" aria-label="Document input type">
                      <button
                        type="button"
                        className={documentInputMode === "url" ? "is-active" : ""}
                        onClick={() => setDocumentInputMode("url")}
                      >
                        Document URL
                      </button>
                      <button
                        type="button"
                        className={documentInputMode === "file" ? "is-active" : ""}
                        onClick={() => setDocumentInputMode("file")}
                      >
                        Upload file
                      </button>
                    </div>

                    {documentInputMode === "url" ? (
                      <div>
                        <Upload size={18} aria-hidden="true" />
                        <input
                          name="documentUrl"
                          value={verification.documentUrl}
                          onChange={updateVerification}
                          placeholder="https://res.cloudinary.com/.../license.jpg"
                        />
                      </div>
                    ) : (
                      <label className="org-document-upload">
                        <Upload size={18} aria-hidden="true" />
                        <span>
                          {uploadingDocument
                            ? "Uploading document..."
                            : documentFileName || "Choose PDF or image from your device"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={uploadVerificationDocument}
                          disabled={uploadingDocument}
                        />
                      </label>
                    )}
                  </div>
                </section>

                <footer className="org-register-actions">
                  <button
                    type="button"
                    className="org-register-btn org-register-btn--ghost"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="org-register-btn org-register-btn--soft"
                    onClick={submitBasicOrganization}
                    disabled={loading}
                  >
                    Skip verification
                  </button>
                  <button
                    type="button"
                    className="org-register-btn org-register-btn--primary"
                    onClick={goToConfirm}
                    disabled={loading}
                  >
                    Verify identity
                  </button>
                </footer>
              </div>
            )}

            {step === 3 && (
              <div className="org-register-panel">
                <header className="org-register-panel__header">
                  <span>Step 3</span>
                  <h2>Confirm registration</h2>
                  <p>Review your organization information one more time.</p>
                </header>

                <section className="org-confirm-card">
                  <h3>Organization profile</h3>
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
                </section>

                <section className="org-confirm-card">
                  <h3>Verification request</h3>
                  <dl>
                    <div>
                      <dt>Tax number</dt>
                      <dd>{verification.taxIdNumber || "-"}</dd>
                    </div>
                    <div>
                      <dt>Document type</dt>
                      <dd>{verification.documentType}</dd>
                    </div>
                    <div>
                      <dt>Document URL</dt>
                      <dd>{verification.documentUrl || "-"}</dd>
                    </div>
                  </dl>
                </section>

                <footer className="org-register-actions">
                  <button
                    type="button"
                    className="org-register-btn org-register-btn--ghost"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button className="org-register-btn org-register-btn--primary" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit registration"}
                  </button>
                </footer>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
