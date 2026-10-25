import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, FileCheck2, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useOrgBySlug } from "../../../hooks/admin/org/useOrgBySlug";
import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";
import DashboardCard from "../../../components/admin/dashboard/DashboardCard";
import { UpdateOrgPopup } from "../../../components/admin/org/updateOrg";
import "../../../styles/admin/layout/org-detail.css";
import { useUpload } from "../../../hooks/admin/useUpload";
import { useUpdateBanner } from "../../../hooks/admin/org/useUpdateBanner";
import { toast } from "react-toastify";
import toastHot from "react-hot-toast";
import { BannerCropper } from "../../../components/admin/layout/BannerCropper";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "../../../utils/imageUtils";
import { useSubmitOrgVerification } from "../../../hooks/admin/orgVerification/useOrgVerification";
import { triggerNotification } from "../../../hooks/notification/useNotificationTrigger";
import { orgService } from "../../../services/admin/organization.service";
import { OrgRequestStatus } from "../../../types/enum";

const formatOrgStatus = (status?: string) => {
  if (!status) return "-";
  return status;
};

const getVerificationLabel = (value?: boolean) =>
  value ? "Verified" : "Not verified";

export default function OrganizationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useOrgBySlug(slug || "");
  const [showEdit, setShowEdit] = useState(false);
  const { upload } = useUpload();
  const { updateBanner } = useUpdateBanner();
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationTax, setVerificationTax] = useState("");
  const [verificationDocumentUrl, setVerificationDocumentUrl] = useState("");
  const [verificationFileName, setVerificationFileName] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [approvingOrganization, setApprovingOrganization] = useState(false);
  const { submitVerification, loading: submittingVerification } =
    useSubmitOrgVerification();
  const isOrgWorkspace = location.pathname.startsWith("/org/");
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const handleChangeBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate định dạng file ngay lập tức
    if (!file.type.startsWith("image/")) {
      toast.warn("File must be an image");
      e.target.value = ""; // Reset ngay
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const imageDataUrl = reader.result as string;
      const img = new Image();
      img.src = imageDataUrl;

      img.onload = () => {
        // 2. Validate độ phân giải
        const minWidth = 800;
        const minHeight = 280;

        if (img.width < minWidth || img.height < minHeight) {
          toast.error(
            `Image resolution too low. Minimum required: ${minWidth}x${minHeight}px for best quality.`,
          );
          e.target.value = ""; // Reset input để chọn lại
          return; // Dừng lại ở đây, không gọi setTempImage
        }

        // 3. Nếu mọi thứ OK mới set ảnh để mở Modal
        setTempImage(imageDataUrl);

        // Reset value để có thể chọn lại chính ảnh này nếu bấm Cancel
        e.target.value = "";
      };

      img.onerror = () => {
        toast.error("Failed to load image. Please try another file.");
        e.target.value = "";
      };
    };
  };

  const handleConfirmCrop = async (croppedAreaPixels: Area) => {
    if (!tempImage) return;
    try {
      // 2. Validate tỷ lệ ảnh (Aspect Ratio)
      const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels);
      setTempImage(null); // Đóng modal crop

      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("folder", "banner");

      await toastHot.promise(
        (async () => {
          const res = await upload(formData);
          const bannerUrl =
            res?.url || res?.secure_url || res?.data?.url || res?.data?.secure_url;
          if (!bannerUrl) throw new Error("Máy chủ không trả về URL ảnh banner hợp lệ");

          const success = await updateBanner(data.id, bannerUrl);
          await refetch();
          if (!success) throw new Error("Update banner failed");
          return success;
        })(),
        {
          loading: "Uploading image...",
          success: "Banner updated successfully",
          error: (err) => `${err.message}`,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Error when cropping image");
    }
  };

  const handleVerificationDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isAllowed =
      file.type === "application/pdf" || file.type.startsWith("image/");
    if (!isAllowed) {
      toast.warn("Verification document must be a PDF or image file");
      e.target.value = "";
      return;
    }

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "org-verification");
      const res = await upload(formData);
      const url =
        res?.url || res?.secure_url || res?.data?.url || res?.data?.secure_url;

      if (!url) throw new Error("Upload response missing document URL");

      setVerificationDocumentUrl(url);
      setVerificationFileName(file.name);
      toast.success("Verification document uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Upload document failed");
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP)");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước logo tối đa là 5MB");
      e.target.value = "";
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logo");

      await toastHot.promise(
        (async () => {
          const res = await upload(formData);
          const logoUrl =
            res?.url || res?.secure_url || res?.data?.url || res?.data?.secure_url;
          if (!logoUrl) throw new Error("Máy chủ không trả về URL logo hợp lệ");

          await orgService.updateLogo(data.id, logoUrl);
          await refetch();
          return true;
        })(),
        {
          loading: "Đang tải lên logo...",
          success: "Cập nhật logo tổ chức thành công!",
          error: (err) => `${err.message || "Không thể cập nhật logo"}`,
        },
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const closeVerificationModal = () => {
    setShowVerification(false);
    setVerificationTax("");
    setVerificationDocumentUrl("");
    setVerificationFileName("");
  };

  const handleSubmitVerification = async () => {
    if (!data?.id) {
      toast.error("Organization ID is missing");
      return;
    }

    if (!verificationTax.trim()) {
      toast.warn("Please enter the business tax number");
      return;
    }

    if (!verificationDocumentUrl) {
      toast.warn("Please upload a verification document");
      return;
    }

    const success = await submitVerification(
      data.id,
      verificationTax.trim(),
      verificationDocumentUrl,
    );

    if (success) {
      await triggerNotification("ORG_VERIFICATION_SUBMITTED", {
        orgName: data.name,
      });
      toast.success("Verification request submitted");
      closeVerificationModal();
    } else {
      toast.error("Submit verification request failed");
    }
  };

  const handleApproveOrganization = async () => {
    if (!data?.id || approvingOrganization) return;

    try {
      setApprovingOrganization(true);
      await orgService.approveOrganization(data.id);
      toast.success("Organization approved");
      await refetch();
    } finally {
      setApprovingOrganization(false);
    }
  };

  if (loading) return <AdminSkeleton variant="detail" />;

  if (error) {
    return (
      <div className="org-detail__not-found">
        <h2>Could not load organization</h2>
        <p>Không thể tải dữ liệu tổ chức. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="org-detail__not-found">
        <h2>Organization not found</h2>
        {/* <button
          className="org-detail__back-btn"
          onClick={() => navigate("/admin/organizations")}
        >
          Back
        </button> */}
      </div>
    );
  }

  const verified = Boolean(data.isVerified || data.isve);
  const canApproveOrganization = !isOrgWorkspace && data.status === OrgRequestStatus.PENDING;

  return (
    <div className="org-detail">
      {showEdit && (
        <UpdateOrgPopup
          id={data.id || ""}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            refetch();
          }}
        />
      )}
      {/* COVER */}
      <div className="org-detail__cover">
        <img
          src={data.bannerUrl || "/org-banner-default.png"}
          alt="Organization Cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src.includes("/org-banner-default.png")) {
              target.style.opacity = "0";
            } else {
              target.src = "/org-banner-default.png";
            }
          }}
        />
        <input
          type="file"
          accept="image/*"
          hidden
          id="bannerUpload"
          onChange={handleChangeBanner}
        />

        <button
          className="org-detail__cover-btn"
          onClick={() => document.getElementById("bannerUpload")?.click()}
        >
          <img
            width="14"
            height="14"
            src="https://img.icons8.com/ios-glyphs/30/camera--v1.png"
          />
          Change Cover
        </button>
      </div>
      {tempImage && (
        <BannerCropper
          image={tempImage}
          onCropComplete={handleConfirmCrop}
          onCancel={() => setTempImage(null)}
        />
      )}
      {/* HEADER */}
      <div className="org-detail__header">
        <div className="header-left-detail">
          <button
            type="button"
            className="org-detail__back-link"
            onClick={() => navigate(isOrgWorkspace ? "/org/dashboard" : "/admin/organizations")}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          {/* AVATAR / LOGO */}
          <div
            className="org-detail__avatar"
            onClick={() => document.getElementById("org-logo-file-input")?.click()}
            title="Click to change organization logo"
            style={{ cursor: "pointer", position: "relative" }}
          >
            <img
              src={
                data.logoUrl ||
                data.logo ||
                "https://img.icons8.com/nolan/256/user-default.png"
              }
              alt="Organization logo"
              onError={(e) => {
                e.currentTarget.src =
                  "https://img.icons8.com/nolan/256/user-default.png";
              }}
            />
            {verified && <div className="org-detail__badge">✓</div>}
            <input
              id="org-logo-file-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />
          </div>
          <span className="org-detail__subtitle">ORGANIZATION PROFILE</span>
          <h1 className="org-detail__title">{data.name}</h1>
        </div>

        <div className="org-detail__actions">
          {isOrgWorkspace &&
            (verified ? (
              <span className="org-detail__verified-pill">
                <BadgeCheck size={17} aria-hidden="true" />
                Verified business
              </span>
            ) : (
              <button
                className="org-detail__btn org-detail__btn--verify"
                onClick={() => setShowVerification(true)}
              >
                <ShieldCheck size={17} aria-hidden="true" />
                Request Verification
              </button>
            ))}
          <button
            className="org-detail__btn btn-edit"
            onClick={() => setShowEdit(true)}
          >
            Edit Organization
          </button>
          {canApproveOrganization && (
            <button
              className="org-detail__btn org-detail__btn--approve"
              onClick={handleApproveOrganization}
              disabled={approvingOrganization}
            >
              <BadgeCheck size={17} aria-hidden="true" />
              {approvingOrganization ? "Approving..." : "Approve Organization"}
            </button>
          )}

          {/* <button
            className="org-detail__btn btn-back"
            onClick={() => navigate("/admin/organizations")}
          >
            Back
          </button> */}
        </div>
      </div>

      {/* 3 Cards */}
      <div className="org-detail__cards">
        <DashboardCard
          title="Total Members"
          value={data.totalMembers ?? 0}
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/gender-neutral-user.png"
              alt="members"
            />
          }
        />
        <DashboardCard
          title="Total Events"
          value={data.totalEvents ?? 0}
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/today.png"
              alt="events"
            />
          }
        />
        <DashboardCard
          title="Status"
          value={formatOrgStatus(data.status)}
          className="org-detail__compact-status-card"
          icon={
            <ShieldCheck size={24} aria-hidden="true" />
          }
        />
        <DashboardCard
          title="Verification"
          value={getVerificationLabel(verified)}
          className={`org-detail__verification-card ${
            verified
              ? "org-detail__verification-card--verified"
              : "org-detail__verification-card--unverified"
          }`}
          icon={
            <BadgeCheck size={24} aria-hidden="true" />
          }
        />
      </div>

      {/* Bottom: left 2/3, right 1/3 */}
      <div className="org-detail__grid">
        {/* Left */}
        <div className="org-detail__panel left">
          {/* Hàng 1: Legal Name và Industry */}
          <h3 className="org-detail__panel-title">Information</h3>

          <div className="org-detail__row">
            <div className="org-detail__field">
              <label className="org-detail__label">LEGAL NAME</label>
              <p className="org-detail__value">{data.name}</p>
            </div>
            <div className="org-detail__field">
              <label className="org-detail__label">INDUSTRY</label>
              <p className="org-detail__value">{data.industry}</p>
            </div>
          </div>

          {/* Hàng 2: Description (Chiếm 100% chiều ngang) */}
          <div className="org-detail__field full-width">
            <label className="org-detail__label">DESCRIPTION</label>
            <p className="org-detail__value bio-text">
              {data.bio || "No description available."}
            </p>
          </div>

          {/* Hàng 3: Headquarters và Tax ID */}
          <div className="org-detail__row">
            <div className="org-detail__field">
              <label className="org-detail__label">HEADQUARTERS</label>
              <p className="org-detail__value">{data.address}</p>
            </div>
            <div className="org-detail__field">
              <label className="org-detail__label">TAX ID</label>
              <p className="org-detail__value">{data.taxId || ""}</p>
            </div>
          </div>
        </div>
        <div className="org-detail__right">
          {/* MAP */}
          <div className="org-detail__map">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                `${data.address || "Việt Nam"}`,
              )}&output=embed`}
              loading="lazy"
            />
          </div>

          {/* CONTACT */}
          <div className="org-detail__panel">
            <h3 className="org-detail__panel-title">Contact</h3>

            <div className="org-detail__field">
              <label className="org-detail__label">Owner</label>
              <p className="org-detail__value">
                {data.owner ? data.owner.fullName : "-"}
              </p>
            </div>

            <div className="org-detail__field">
              <label className="org-detail__label">Email</label>
              <p className="org-detail__value">
                {data.owner ? data.owner.email : "-"}
              </p>
            </div>

            <div className="org-detail__field">
              <label className="org-detail__label">Created At</label>
              <p className="org-detail__value">
                {data.createdAt ? formatDate(data.createdAt.toString()) : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showVerification && (
        <div className="org-verification-request" onClick={closeVerificationModal}>
          <section
            className="org-verification-request__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-verification-request-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="org-verification-request__header">
              <div className="org-verification-request__heading">
                <span className="org-verification-request__eyebrow">
                  Business verification
                </span>
                <h2 id="org-verification-request-title">
                  Verify {data.name}
                </h2>
                <p>
                  Submit the tax number and one official document so the admin
                  team can review this organization.
                </p>
              </div>
              <button
                type="button"
                className="org-verification-request__close"
                aria-label="Close verification form"
                onClick={closeVerificationModal}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="org-verification-request__body">
              <label className="org-verification-request__field">
                <span>Business tax number</span>
                <input
                  value={verificationTax}
                  onChange={(event) => setVerificationTax(event.target.value)}
                  placeholder="Example: 0312345678"
                />
              </label>

              <div className="org-verification-request__documents">
                <span>Required document</span>
                <p>
                  Upload one official business document that clearly contains
                  the company name, tax number, and legal representative.
                </p>
                <ul>
                  <li>Business registration certificate</li>
                  <li>Tax registration certificate or tax authority notice</li>
                  <li>Legal representative information page</li>
                </ul>
              </div>

              <input
                id="orgVerificationDocument"
                type="file"
                hidden
                accept="application/pdf,image/*"
                onChange={handleVerificationDocument}
              />
              <button
                type="button"
                className={`org-verification-request__upload ${
                  verificationFileName ? "org-verification-request__upload--ready" : ""
                }`}
                onClick={() =>
                  document.getElementById("orgVerificationDocument")?.click()
                }
                disabled={uploadingDocument}
              >
                <span className="org-verification-request__uploadIcon">
                  {verificationFileName ? (
                    <FileCheck2 size={21} aria-hidden="true" />
                  ) : (
                    <UploadCloud size={21} aria-hidden="true" />
                  )}
                </span>
                <span className="org-verification-request__uploadText">
                  <strong>
                    {uploadingDocument
                      ? "Uploading document..."
                      : verificationFileName || "Upload verification document"}
                  </strong>
                  <small>
                    {verificationFileName
                      ? "File selected. Click again to replace it."
                      : "PDF, PNG or JPG. Use a document showing name, tax number and representative."}
                  </small>
                </span>
              </button>

              {verificationDocumentUrl && (
                <a
                  className="org-verification-request__preview"
                  href={verificationDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileCheck2 size={18} aria-hidden="true" />
                  View uploaded document
                </a>
              )}
            </div>

            <footer className="org-verification-request__footer">
              <button
                type="button"
                className="org-verification-request__btn org-verification-request__btn--ghost"
                onClick={closeVerificationModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="org-verification-request__btn org-verification-request__btn--primary"
                onClick={handleSubmitVerification}
                disabled={submittingVerification || uploadingDocument}
              >
                {submittingVerification ? "Submitting..." : "Submit request"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
