import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useCreateEvent } from "../../../hooks/admin/event/useCreateEvent";
import type { EventPayload } from "../../../types/event/create";
import "../../../styles/admin/popup/popup.css";
import { toast } from "react-toastify";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import Select from "react-select";
import { useSwitchOrg } from "../../../hooks/admin/org/useSwitchOrg";
import { PosterUpload } from "../layout/Upload";
import { useUpload } from "../../../hooks/admin/useUpload";
import { PlaceInput } from "../layout/Place";
import { eventService } from "../../../services/admin/event.service";
import type { CategoryDto } from "../../../types/event/event";
import { EventDateTimePicker } from "./EventDateTimePicker";

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

const CREATE_EVENT_FORM_ID = "create-event-form";

const logCreateEventDebug = (
  marker: string,
  details?: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;
  console.info(marker, details ?? {});
};

const getCreateEventSubmitState = (
  form: Partial<EventPayload>,
  banner: File | null,
) => ({
  hasBanner: Boolean(banner),
  hasTitle: Boolean(form.title?.trim()),
  hasStartDateTime: Boolean(form.startDateTime),
  hasEndDateTime: Boolean(form.endDateTime),
  hasRegistrationEndDate: Boolean(form.registrationEndDate),
  hasCapacity: Boolean(form.capacity && form.capacity > 0),
  hasOrganizationId: Boolean(form.organizationId),
  categoryIdsCount: form.categoryIds?.length ?? 0,
  hasPlace: Boolean(form.place?.trim()),
});

export const CreateEventPopup = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { createEvent, loading } = useCreateEvent();
  const [banner, setBanner] = useState<File | null>(null);
  const { data: switchOrgs } = useSwitchOrg();
  const { upload } = useUpload();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const focusField = (fieldName: string) => {
    const field = document.querySelector<HTMLElement>(
      `#${CREATE_EVENT_FORM_ID} [name="${fieldName}"], #${CREATE_EVENT_FORM_ID} #${fieldName}`,
    );
    field?.focus();
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const showValidationError = (message: string, fieldName?: string) => {
    toast.warning(message);
    if (fieldName) focusField(fieldName);
  };

  const failValidation = (
    reason: string,
    message: string,
    fieldName?: string,
  ) => {
    logCreateEventDebug("CREATE_EVENT_VALIDATION_FAILED", {
      reason,
      fieldName,
      ...getCreateEventSubmitState(form, banner),
    });
    showValidationError(message, fieldName);
    return false;
  };

  const validateForm = () => {
    if (!banner) {
      return failValidation(
        "missing_banner",
        "Vui lòng chọn banner sự kiện.",
        "event-banner-create-input",
      );
    }
    if (!form.title?.trim()) {
      return failValidation("missing_title", "Vui lòng nhập tên sự kiện.", "title");
    }
    if (!form.startDateTime) {
      return failValidation(
        "missing_startDateTime",
        "Vui lòng chọn thời gian bắt đầu.",
        "startDateTime",
      );
    }
    if (!form.endDateTime) {
      return failValidation(
        "missing_endDateTime",
        "Vui lòng chọn thời gian kết thúc.",
        "endDateTime",
      );
    }
    if (new Date(form.endDateTime).getTime() <= new Date(form.startDateTime).getTime()) {
      return failValidation(
        "endDateTime_not_after_startDateTime",
        "Thời gian kết thúc phải sau thời gian bắt đầu.",
        "endDateTime",
      );
    }
    if (!form.registrationEndDate) {
      return failValidation(
        "missing_registrationEndDate",
        "Vui lòng chọn hạn đăng ký.",
        "registrationEndDate",
      );
    }
    if (new Date(form.registrationEndDate).getTime() > new Date(form.startDateTime).getTime()) {
      return failValidation(
        "registrationEndDate_after_startDateTime",
        "Hạn đăng ký không được sau thời gian bắt đầu.",
        "registrationEndDate",
      );
    }
    if (!form.capacity || form.capacity < 1) {
      return failValidation(
        "invalid_capacity",
        "Vui lòng nhập sức chứa hợp lệ.",
        "capacity",
      );
    }
    if (!form.organizationId) {
      return failValidation("missing_organizationId", "Vui lòng chọn tổ chức.");
    }
    if (!form.categoryIds?.length) {
      return failValidation("missing_categoryIds", "Vui lòng chọn danh mục sự kiện.");
    }
    if (!form.place?.trim()) {
      return failValidation("missing_place", "Vui lòng chọn địa điểm.", "place");
    }

    return true;
  };

  const getSubmitErrorMessage = (error: any) => {
    const message = error?.response?.data?.message || error?.message;
    if (Array.isArray(message)) return message[0];
    return message || "Không thể tạo sự kiện. Vui lòng thử lại.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logCreateEventDebug("CREATE_EVENT_FORM_SUBMIT_ATTEMPT", {
      ...getCreateEventSubmitState(form, banner),
    });

    if (isSubmitting || loading) return;

    if (!validateForm()) return;

    logCreateEventDebug("CREATE_EVENT_VALIDATION_PASSED", {
      ...getCreateEventSubmitState(form, banner),
    });

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", banner as File);
      formData.append("folder", "banner");
      const res = await upload(formData);
      const submitForm: EventPayload = {
        title: form.title!.trim(),
        eventBanner: res.secure_url,
        startDateTime: form.startDateTime!,
        endDateTime: form.endDateTime!,
        registrationEndDate: form.registrationEndDate!,
        capacity: Number(form.capacity),
        organizationId: form.organizationId!,
        categoryIds: form.categoryIds!,
        description: form.description || "",
        place: form.place!.trim(),
      };

      logCreateEventDebug("CREATE_EVENT_API_CALL_START", {
        endpoint: "POST events",
        payload: {
          hasTitle: Boolean(submitForm.title),
          hasEventBanner: Boolean(submitForm.eventBanner),
          hasStartDateTime: Boolean(submitForm.startDateTime),
          hasEndDateTime: Boolean(submitForm.endDateTime),
          hasRegistrationEndDate: Boolean(submitForm.registrationEndDate),
          capacity: submitForm.capacity,
          hasOrganizationId: Boolean(submitForm.organizationId),
          categoryIdsCount: submitForm.categoryIds.length,
          hasPlace: Boolean(submitForm.place),
        },
      });
      await createEvent(submitForm);
      logCreateEventDebug("CREATE_EVENT_API_CALL_SUCCESS");
      toast.success("Tạo sự kiện thành công.");
      onClose();
      onSuccess();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        logCreateEventDebug("CREATE_EVENT_API_CALL_ERROR", {
          status: error?.response?.status,
          message: getSubmitErrorMessage(error),
        });
        console.error("Create event failed", error);
      }
      toast.error(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLoading = isSubmitting || loading;

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
            <h2>Create Event</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <form
          id={CREATE_EVENT_FORM_ID}
          className="popup-form"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="form-group full-width">
            <label className="required event-media-label">Event Banner</label>
            <p className="event-media-hint">
              Used on event cards, event detail hero, and public discovery pages.
            </p>
            <PosterUpload
              value={banner}
              onChange={setBanner}
              inputId="event-banner-create-input"
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
              }))}
              value={
                switchOrgs?.find((org: any) => org.id === form.organizationId)
                  ? {
                      value: form.organizationId,
                      label: switchOrgs.find(
                        (org: any) => org.id === form.organizationId,
                      )?.name,
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
              placeholder={categoryLoading ? "Loading categories..." : "Select one or more categories"}
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
              name="description"
              placeholder="Event description..."
              rows={4}
              value={form.description || ""}
              style={{ whiteSpace: "pre-wrap" }}
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
        <div className="popup-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={CREATE_EVENT_FORM_ID}
            disabled={submitLoading}
            onClick={() =>
              logCreateEventDebug("CREATE_EVENT_BUTTON_CLICK", {
                ...getCreateEventSubmitState(form, banner),
              })
            }
          >
            {submitLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
