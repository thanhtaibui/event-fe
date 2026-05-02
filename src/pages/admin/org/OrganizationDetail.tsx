import { useParams } from "react-router-dom";
import { useState } from "react";
import { useOrgBySlug } from "../../../hooks/admin/org/useOrgBySlug";
import LoadingPage from "../../LoadingPage";
import DashboardCard from "../../../components/dashboard/DashboardCard";
import { UpdateOrgPopup } from "../../../components/org/updateOrg";
import "../../../styles/layout/org-detail.css";
import { useUploadAvt } from "../../../hooks/admin/org/useUploadAvt";
import { useUpdateBanner } from "../../../hooks/admin/org/useUpdateBanner";
import { toast } from "react-toastify";
import toastHot from "react-hot-toast";
import { BannerCropper } from "../../../components/layout/BannerCropper";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "../../../utils/imageUtils";

export default function OrganizationDetail() {
  const { slug } = useParams<{ slug: string }>();
  // const navigate = useNavigate();
  const { data, loading, refetch } = useOrgBySlug(slug || "");
  const [showEdit, setShowEdit] = useState(false);
  const { uploadAvt } = useUploadAvt();
  const { updateBanner } = useUpdateBanner();
  const [tempImage, setTempImage] = useState<string | null>(null);
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
          const res = await uploadAvt(formData);
          // Lưu ý: check res.data.secure_url tùy theo cấu trúc ApiResponse của ông
          const success = await updateBanner(
            data.id,
            res.secure_url || res.data?.secure_url,
          );
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

  if (loading) return <LoadingPage />;

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

  return (
    <div className="org-detail">
      {showEdit && (
        <UpdateOrgPopup
          id={data.id || ""}
          onClose={() => setShowEdit(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {/* COVER */}
      <div className="org-detail__cover">
        {data.bannerUrl ? (
          <img src={data.bannerUrl} alt="Organization Cover" />
        ) : (
          <div className="org-detail__cover-placeholder"></div>
        )}
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
          {/* AVATAR */}
          <div className="org-detail__avatar">
            <img
              src={
                data.logoUrl ||
                "https://img.icons8.com/nolan/256/user-default.png"
              }
              alt="avatar"
            />
            {data.isVerified && <div className="org-detail__badge">✓</div>}
          </div>
          <span className="org-detail__subtitle">ORGANIZATION PROFILE</span>
          <h1 className="org-detail__title">{data.name}</h1>
        </div>

        <div className="org-detail__actions">
          <button
            className="org-detail__btn btn-edit"
            onClick={() => setShowEdit(true)}
          >
            Edit Organization
          </button>

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
          value={data.status}
          icon={
            <img
              width="35"
              height="35"
              src="https://img.icons8.com/nolan/64/ok.png"
              alt="status"
            />
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
    </div>
  );
}
