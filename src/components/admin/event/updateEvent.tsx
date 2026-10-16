import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "../../../styles/admin/popup/popup.css";
import { toast } from "react-toastify";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import Select from "react-select";
import { useEventById } from "../../../hooks/admin/event/useEventById";
import type { EventPayload } from "../../../types/event/create";
import { useSwitchOrg } from "../../../hooks/admin/org/useSwitchOrg";
import { PosterUpload } from "../layout/Upload";
import { useUpload } from "../../../hooks/admin/useUpload";
import { useUpdateEvent } from "../../../hooks/admin/event/useUpdateEvent";
import { PlaceInput } from "../layout/Place";
import { eventService } from "../../../services/admin/event.service";
import type { CategoryDto } from "../../../types/event/event";
import { EventDateTimePicker } from "./EventDateTimePicker";
import { AdminModalError, AdminModalLoading } from "../layout/AdminModalState";

const UPDATE_EVENT_FORM_ID = "update-event-form";

type SelectOption = {
  value: string;
  label: string;
};

type CategoryResponse =
  | CategoryDto[]
  | {
      data?: CategoryDto[] | { items?: CategoryDto[]; data?: CategoryDto[] };
      items?: CategoryDto[];
    };

function extractCategories(response: CategoryResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "items" in response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function getEventCategoryIds(event: any): string[] {
  if (!event) return [];
  if (Array.isArray(event.categoryIds)) {
    return event.categoryIds.map(String).filter(Boolean);
  }
  const eventCategories = event?.categories ?? event?.eventCategories ?? [];
  if (!Array.isArray(eventCategories)) return [];

  return eventCategories
    .map((category: any) =>
      typeof category === "string" ? category : category?.id
    )
    .filter(Boolean);
}

function toIsoDateTime(dateValue: any): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {}
  return "";
}

function getErrorMessage(error: any): { status?: number; message: string } {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message || error?.message;
  const message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;

  if (status === 401) {
    return { status, message: "Unauthorized: Vui lòng đăng nhập lại." };
  }
  if (status === 400) {
    return { status, message: message || "Validation error: Dữ liệu cập nhật không hợp lệ." };
  }
  if (status === 403) {
    return { status, message: "No permission: Bạn không có quyền thực hiện thao tác này." };
  }
  if (status === 404) {
    return { status, message: "Event not found: Sự kiện không tồn tại hoặc đã bị xóa." };
  }
  if (status && status >= 500) {
    return { status, message: "Server error: Lỗi máy chủ, vui lòng thử lại sau." };
  }

  return { status, message: message || "Đã xảy ra lỗi. Vui lòng thử lại." };
}

export const UpdateEventPopup = ({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const { updateEvent } = useUpdateEvent();
  const { data: switchOrgs } = useSwitchOrg();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [uiLoading, setUiLoading] = useState(false);
  const eventById = useEventById(id);
  const { upload } = useUpload();
  const [detailReady, setDetailReady] = useState(false);
  const [fallbackOrgName, setFallbackOrgName] = useState("");
  const [form, setForm] = useState<Partial<EventPayload>>({
    title: "",
    eventBanner: "",
    startDateTime: "",
    endDateTime: "",
    registrationEndDate: "",
    capacity: 0,
    organizationId: "",
    categoryIds: [],
    description: "",
    place: "",
  });

  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      setCategoryLoading(true);
      setCategoryError("");
      try {
        const response = await eventService.getCategories({ limit: 100 });
        if (!ignore) setCategories(extractCategories(response));
      } catch {
        if (!ignore) {
          setCategories([]);
          setCategoryError("Không thể tải danh mục sự kiện");
        }
      } finally {
        if (!ignore) setCategoryLoading(false);
      }
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );

  useEffect(() => {
    setDetailReady(false);
    setBanner(null);
    setBannerUrl("");
    setFallbackOrgName("");
    setForm({
      title: "",
      eventBanner: "",
      startDateTime: "",
      endDateTime: "",
      registrationEndDate: "",
      capacity: 0,
      organizationId: "",
      categoryIds: [],
      description: "",
      place: "",
    });
  }, [id]);

  useEffect(() => {
    if (!eventById.data) return;

    try {
      const rawEvent = eventById.data?.data ?? eventById.data;
      if (!rawEvent) return;

      const bannerImg = rawEvent.eventBanner || rawEvent.banner || "";
      setBannerUrl(bannerImg);

      const orgId =
        rawEvent.organization?.id ||
        rawEvent.organizationId ||
        (typeof rawEvent.organization === "string" ? rawEvent.organization : "") ||
        "";

      const orgName =
        rawEvent.organization?.name ||
        (typeof rawEvent.organization === "string" ? rawEvent.organization : "");

      if (orgName) setFallbackOrgName(orgName);

      setForm({
        title: rawEvent.title || "",
        eventBanner: bannerImg,
        startDateTime: toIsoDateTime(rawEvent.startDateTime),
        endDateTime: toIsoDateTime(rawEvent.endDateTime),
        registrationEndDate: toIsoDateTime(rawEvent.registrationEndDate),
        capacity: Number(rawEvent.capacity) || 0,
        organizationId: orgId,
        categoryIds: getEventCategoryIds(rawEvent),
        description: rawEvent.description || "",
        place:
          typeof rawEvent.place === "string"
            ? rawEvent.place
            : rawEvent.place?.name ||
              rawEvent.place?.address ||
              rawEvent.location ||
              "",
      });
      setDetailReady(true);
    } catch (err) {
      console.error("[UpdateEventPopup] Failed to populate form data:", err);
      setDetailReady(true);
    }
  }, [eventById?.data]);

  const isInitialLoading = eventById.loading || (!detailReady && !eventById.error);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleOrgChange = (selected: any) => {
    setForm((prev) => ({ ...prev, organizationId: selected?.value || "" }));
  };

  const handleCategoryChange = (selected: readonly SelectOption[]) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: selected.map((category) => category.value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("FORM SUBMIT START");

    if (!bannerUrl && !banner) {
      toast.warning("Event banner is required");
      return;
    }

    if (!form.title?.trim()) {
      toast.warning("Please enter event title");
      return;
    }

    if (!form.description?.trim()) {
      toast.warning("Please enter event description");
      return;
    }

    if (!form.startDateTime) {
      toast.warning("Please select start date and time");
      return;
    }

    if (!form.endDateTime) {
      toast.warning("Please select end date and time");
      return;
    }

    if (!form.registrationEndDate) {
      toast.warning("Please select registration end date");
      return;
    }

    if (!form.capacity || form.capacity <= 0) {
      toast.warning("Capacity must be greater than 0");
      return;
    }

    if (!form.organizationId) {
      toast.warning("Please select an organization");
      return;
    }

    if (!form.categoryIds?.length) {
      toast.warning("Please select at least one category");
      return;
    }

    if (!form.place?.trim()) {
      toast.warning("Please enter event place");
      return;
    }

    const startTime = new Date(form.startDateTime).getTime();
    const endTime = new Date(form.endDateTime).getTime();
    const regEndTime = new Date(form.registrationEndDate).getTime();

    if (isNaN(startTime) || isNaN(endTime) || isNaN(regEndTime)) {
      toast.warning("Invalid date format");
      return;
    }

    if (endTime <= startTime) {
      toast.warning("End datetime must be after start datetime");
      return;
    }

    if (regEndTime > startTime) {
      toast.warning("Registration end date cannot be after start datetime");
      return;
    }

    console.log("VALIDATION PASSED");

    setUiLoading(true);
    try {
      let bannerFinal = bannerUrl;

      // upload ảnh mới nếu có
      if (banner) {
        const formData = new FormData();
        formData.append("file", banner);
        formData.append("folder", "banner");

        const uploadRes = await upload(formData);
        if (uploadRes?.secure_url || uploadRes?.url) {
          bannerFinal = uploadRes.secure_url || uploadRes.url;
        } else {
          throw new Error("Không thể tải lên ảnh banner");
        }
      }

      // update event
      const payload: EventPayload = {
        title: form.title.trim(),
        eventBanner: bannerFinal,
        startDateTime: toIsoDateTime(form.startDateTime),
        endDateTime: toIsoDateTime(form.endDateTime),
        registrationEndDate: toIsoDateTime(form.registrationEndDate),
        capacity: Number(form.capacity),
        organizationId: form.organizationId,
        categoryIds: form.categoryIds,
        description: form.description?.trim() || "",
        place: form.place.trim(),
      };

      console.log("CALL UPDATE API");
      console.log("UPDATE PAYLOAD", payload);
      const response = await updateEvent(id, payload);
      console.log("UPDATE SUCCESS", response);
      toast.success("Event updated successfully");

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("UPDATE ERROR", error);
      const { message } = getErrorMessage(error);
      toast.error(message);
    } finally {
      setUiLoading(false);
    }
  };

  return createPortal(
    <div
      className="popup-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="header-items">
            <div className="img">
              <img
                width="27"
                height="27"
                src="https://img.icons8.com/ios/50/calendar-plus.png"
                alt="calendar-plus"
              />
            </div>
            <h2>Update Event</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        {eventById.error ? (
          <AdminModalError
            message={getErrorMessage(eventById.error).message}
            onRetry={eventById.refetch}
          />
        ) : isInitialLoading ? (
          <AdminModalLoading />
        ) : (
          <form
            id={UPDATE_EVENT_FORM_ID}
            className="popup-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-group full-width">
              <label className="required event-media-label">Event Banner</label>
              <p className="event-media-hint">
                Used on event cards, event detail hero, and public discovery pages.
              </p>
              <PosterUpload
                value={banner}
                onChange={setBanner}
                defaultUrl={bannerUrl}
                onRemove={() => {
                  setBanner(null);
                  setBannerUrl("");
                }}
                inputId="event-banner-update-input"
                title="Drag & drop your event banner here"
                subtitle="Recommended 16:9 banner — PNG, JPG, WEBP"
                pasteHint="Or copy an AI image, then press Ctrl+V to paste it here."
                previewAlt="Event banner preview"
                variant="banner"
              />
            </div>
            <div className="form-group">
              <label className="required">Title</label>
              <input
                name="title"
                placeholder="Event title"
                value={form.title || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="required">Start DateTime</label>
              <EventDateTimePicker
                value={form.startDateTime}
                onChange={(startDateTime) =>
                  setForm((prev) => ({ ...prev, startDateTime }))
                }
                maxDate={form.endDateTime || undefined}
                placeholder="dd/mm/yyyy --:--"
                name="startDateTime"
              />
            </div>
            <div className="form-group">
              <label className="required">End DateTime</label>
              <EventDateTimePicker
                value={form.endDateTime}
                onChange={(endDateTime) =>
                  setForm((prev) => ({ ...prev, endDateTime }))
                }
                minDate={form.startDateTime || undefined}
                placeholder="dd/mm/yyyy --:--"
                name="endDateTime"
              />
            </div>
            <div className="form-group">
              <label className="required">Registration End Date</label>
              <EventDateTimePicker
                value={form.registrationEndDate}
                onChange={(registrationEndDate) =>
                  setForm((prev) => ({ ...prev, registrationEndDate }))
                }
                maxDate={form.startDateTime || undefined}
                placeholder="dd/mm/yyyy --:--"
                name="registrationEndDate"
              />
            </div>
            <div className="form-group">
              <label className="required">Capacity</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      capacity: Math.max(1, (p.capacity || 1) - 10),
                    }))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "black",
                  }}
                >
                  −
                </button>

                <input
                  type="number"
                  name="capacity"
                  value={form.capacity || ""}
                  onChange={handleChange}
                  min={1}
                  placeholder="100"
                  style={{
                    width: 100,
                    height: 36,
                    textAlign: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, capacity: (p.capacity || 0) + 10 }))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "black",
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="required">Organization</label>
              <Select
                className="react-select"
                classNamePrefix="custom-select"
                placeholder="Select organization"
                options={switchOrgs?.map((org: any) => ({
                  value: org.id,
                  label: org.name,
                })) || []}
                value={
                  form.organizationId
                    ? {
                        value: form.organizationId,
                        label:
                          switchOrgs?.find(
                            (org: any) => org.id === form.organizationId,
                          )?.name ||
                          fallbackOrgName ||
                          form.organizationId,
                      }
                    : null
                }
                onChange={handleOrgChange}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                }}
              />
            </div>
            <div className="form-group full-width">
              <label className="required">Categories</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="react-select event-category-select"
                classNamePrefix="custom-select"
                placeholder={
                  categoryLoading
                    ? "Loading categories..."
                    : "Select one or more categories"
                }
                options={categoryOptions}
                isLoading={categoryLoading}
                isDisabled={categoryLoading || Boolean(categoryError)}
                value={categoryOptions.filter((category) =>
                  form.categoryIds?.includes(category.value),
                )}
                onChange={(selected) =>
                  handleCategoryChange(selected as readonly SelectOption[])
                }
                loadingMessage={() => "Loading categories..."}
                noOptionsMessage={() => categoryError || "No categories found"}
              />
              {categoryError && <p className="form-error">{categoryError}</p>}
            </div>
            <div className="form-group-textarea">
              <label>Description</label>
              <textarea
                style={{ whiteSpace: "pre-wrap" }}
                name="description"
                placeholder="Event description..."
                rows={4}
                value={form.description || ""}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label className="required">Place</label>
              <PlaceInput
                value={form.place || ""}
                onChange={(val) => setForm((prev) => ({ ...prev, place: val }))}
              />
            </div>
          </form>
        )}
        {detailReady && !eventById.error && (
          <div className="popup-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              form={UPDATE_EVENT_FORM_ID}
              formNoValidate
              disabled={uiLoading}
              onClick={() => {
                console.log("SAVE CLICKED");
              }}
            >
              {uiLoading ? "Save Changes..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
