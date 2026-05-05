import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/layout/popup.css";
import { toast } from "react-toastify";
import { CustomOption, CustomSingleValue } from "../layout/CustomSelect";
import Select from "react-select";
import { useEventById } from "../../hooks/admin/event/useEventById";
import type { EventPayload } from "../../types/event/create";
import { useSwitchOrg } from "../../hooks/admin/org/useSwitchOrg";
import { PosterUpload } from "../layout/Upload";
import { useUpload } from "../../hooks/admin/useUpload";
import Flatpickr from "react-flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import { useUpdateEvent } from "../../hooks/admin/event/useUpdateEvent";

export const UpdateEventPopup = ({
  id,
  onClose,
  onSuccess,
}: {
  id: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [poster, setPoster] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>("");
  const { updateEvent } = useUpdateEvent();
  const { data: switchOrgs } = useSwitchOrg();
  const [uiLoading, setUiLoading] = useState(false);
  // const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const eventById = useEventById(id);
  const { upload } = useUpload();

  const [form, setForm] = useState<Partial<EventPayload>>({
    title: "",
    eventPoster: "",
    startDateTime: "",
    endDateTime: "",
    registrationEndDate: "",
    capacity: 0,
    organizationId: "",
    description: "",
    place: "",
  });
  useEffect(() => {
    const loadData = async () => {
      if (eventById.data) {
        // console.log(eventById.data);
        setPosterUrl(eventById.data.eventPoster || "");
        setForm({
          title: eventById?.data?.title || "",
          // eventPoster: eventById?.data?.eventPoster || "",
          startDateTime: eventById?.data?.startDateTime || "",
          endDateTime: eventById?.data?.endDateTime || "",
          registrationEndDate: eventById.data.registrationEndDate,
          capacity: eventById.data.capacity,
          organizationId: eventById.data.organization.id,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUiLoading(true);
    if (!posterUrl && !poster) {
      toast.warning("Event poster is required");
      return;
    }

    if (
      !form.title ||
      !form.organizationId ||
      form.capacity === 0 ||
      !form.startDateTime ||
      !form.endDateTime ||
      !form.registrationEndDate ||
      !form.place
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    try {
      await toast.promise(
        (async () => {
          let posterFinal = posterUrl;

          if (poster) {
            const formData = new FormData();
            formData.append("file", poster);
            formData.append("folder", "poster");
            const res = await upload(formData);
            posterFinal = res.secure_url;
          }

          const submitForm = { ...form, eventPoster: posterFinal };
          await updateEvent(id, submitForm as EventPayload);
          onClose();
          onSuccess();
        })(),
        {
          pending: "Uploading & updating event...",
          success: "Event updated successfully",
          error: "Failed to update event",
        },
      );
      setUiLoading(false);
    } catch (error) {
      // error đã handled bởi toast.promise
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
            <PosterUpload
              value={poster}
              onChange={setPoster}
              defaultUrl={posterUrl}
              onRemove={() => setPosterUrl("")}
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
          <div className="form-group-textarea">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Event description..."
              rows={4}
              value={form.description || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group full-width">
            <label className="required">Place</label>
            <input
              name="place"
              placeholder="Event place"
              value={form.place || ""}
              onChange={handleChange}
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
