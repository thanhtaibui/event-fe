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
import Flatpickr from "react-flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import { useUpdateEvent } from "../../../hooks/admin/event/useUpdateEvent";
import { PlaceInput } from "../layout/Place";
import { eventService } from "../../../services/admin/event.service";
import type { CategoryDto } from "../../../types/event/event";

type SelectOption = {
  value: string;
  label: string;
};

type CategoryResponse =
  | CategoryDto[]
  | {
      data?: CategoryDto[] | { items?: CategoryDto[] };
      items?: CategoryDto[];
    };

function extractCategories(response: CategoryResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "items" in response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }

  return [];
}

function getEventCategoryIds(event: any) {
  const eventCategories = event?.categories ?? event?.eventCategories ?? [];
  if (!Array.isArray(eventCategories)) return [];

  return eventCategories
    .map((category: CategoryDto) => category.id)
    .filter(Boolean);
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
  const [uiLoading, setUiLoading] = useState(false);
  // const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const eventById = useEventById(id);
  const { upload } = useUpload();
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
      try {
        const response = await eventService.getCategories({ limit: 100 });
        if (!ignore) setCategories(extractCategories(response));
      } catch {
        if (!ignore) setCategories([]);
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
    const loadData = async () => {
      if (eventById.data) {
        // console.log(eventById.data);
        setBannerUrl(eventById.data.eventBanner || "");
        setForm({
          title: eventById?.data?.title || "",
          eventBanner: eventById?.data?.eventBanner || "",
          startDateTime: eventById?.data?.startDateTime || "",
          endDateTime: eventById?.data?.endDateTime || "",
          registrationEndDate: eventById.data.registrationEndDate,
          capacity: eventById.data.capacity,
          organizationId: eventById.data.organization.id,
          categoryIds: getEventCategoryIds(eventById.data),
          description: eventById.data.description,
          place: eventById.data.place,
        });
      }
    };
    loadData();
  }, [eventById?.data]);

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

    if (!bannerUrl && !banner) {
      toast.warning("Event banner is required");
      return;
    }

    if (
      !form.title ||
      !form.organizationId ||
      !form.categoryIds?.length ||
      form.capacity === 0 ||
      !form.startDateTime ||
      !form.endDateTime ||
      !form.registrationEndDate ||
      !form.place
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    setUiLoading(true);
    try {
      let bannerFinal = bannerUrl;

      // upload ảnh mới nếu có
      if (banner) {
        const formData = new FormData();
        formData.append("file", banner);
        formData.append("folder", "banner");

        await toast.promise(
          upload(formData).then((res) => {
            bannerFinal = res.secure_url;
          }),
          {
            pending: "Uploading banner...",
            success: "Banner uploaded!",
            error: "Failed to upload banner",
          },
        );
      }

      // update event
      await updateEvent(id, {
        ...form,
        eventBanner: bannerFinal,
      } as EventPayload);
      toast.success("Event updated successfully");

      onClose();
      onSuccess();
    } catch (error) {
      // handled by toast.promise
    } finally {
      setUiLoading(false);
    }
  };

  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
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
        <form id="popup-form" className="popup-form" onSubmit={handleSubmit}>
          <div className="form-group full-width">
            <label className="required event-media-label">Event Banner</label>
            <p className="event-media-hint">
              Used on event cards, event detail hero, and public discovery pages.
            </p>
            <PosterUpload
              value={banner}
              onChange={setBanner}
              defaultUrl={bannerUrl}
              onRemove={() => setBannerUrl("")}
              inputId="event-banner-update-input"
              title="Drag & drop your event banner here"
              subtitle="Recommended 16:9 banner — PNG, JPG, WEBP"
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
            <Flatpickr
              value={form.startDateTime}
              onChange={([date]: any) =>
                setForm((prev) => ({
                  ...prev,
                  startDateTime: date.toISOString(),
                }))
              }
              options={{
                enableTime: true,
                dateFormat: "d/m/Y H:i",
                time_24hr: true,
                minuteIncrement: 15,
                maxDate: form.endDateTime || undefined,
                locale: Vietnamese,
              }}
              className="date-input"
              placeholder="dd/mm/yyyy --:--"
            />
          </div>
          <div className="form-group">
            <label className="required">End DateTime</label>
            <Flatpickr
              value={form.endDateTime}
              onChange={([date]: any) =>
                setForm((prev) => ({
                  ...prev,
                  endDateTime: date.toISOString(),
                }))
              }
              options={{
                enableTime: true,
                dateFormat: "d/m/Y H:i",
                time_24hr: true,
                minuteIncrement: 15,
                minDate: form.startDateTime || undefined,
                locale: Vietnamese,
              }}
              className="date-input"
              placeholder="dd/mm/yyyy --:--"
            />
          </div>
          <div className="form-group">
            <label className="required">Registration End Date</label>
            <Flatpickr
              value={form.registrationEndDate}
              onChange={([date]: any) =>
                setForm((prev) => ({
                  ...prev,
                  registrationEndDate: date.toISOString(),
                }))
              }
              options={{
                enableTime: true,
                dateFormat: "d/m/Y H:i",
                time_24hr: true,
                minuteIncrement: 15,
                maxDate: form.startDateTime || undefined,
                locale: Vietnamese,
              }}
              className="date-input"
              placeholder="dd/mm/yyyy --:--"
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
              placeholder="Select one or more categories"
              options={categoryOptions}
              value={categoryOptions.filter((category) =>
                form.categoryIds?.includes(category.value),
              )}
              onChange={(selected) =>
                handleCategoryChange(selected as readonly SelectOption[])
              }
              noOptionsMessage={() => "No categories found"}
            />
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
        <div className="popup-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="popup-form" disabled={uiLoading}>
            {uiLoading ? "Save Changes..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
