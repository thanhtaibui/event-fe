import { useEventById } from "../../hooks/admin/event/useEventById";

interface InfoCardProps {
  id: string;
}
export const InfoCard: React.FC<InfoCardProps> = ({ id }) => {
  const { data: event } = useEventById(id);
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
  return (
    <div className="info-grid">
      <div className="info-card">
        <div
          className="info-content"
          title={`${event?.place || "No location provided"}`}
        >
          <div className="info-icon">
            <img
              width="24"
              height="24"
              src="https://img.icons8.com/nolan/64/place-marker.png"
              alt="place-marker"
            />
          </div>
          <h4>Place</h4>
          <div className="org-detail__map">
            {" "}
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                `${event?.place || "Việt Nam"}`,
              )}&output=embed`}
              loading="lazy"
            />
          </div>
        </div>
      </div>
      <div className="info-card">
        <div className="info-icon">
          <img
            width="24"
            height="24"
            src="https://img.icons8.com/nolan/64/calendar.png"
            alt="calendar"
          />
        </div>
        <div className="info-content">
          <h4>Date & Time</h4>
          <p>
            <span
              style={{
                display: "block",
              }}
            >
              {formatDate(event?.startDateTime || "")} <br />—<br />
              {formatDate(event?.endDateTime || "")}
            </span>
            <br />
            <span>
              Reg. deadline:
              <span
                style={{
                  color: "#cb0000",
                  marginLeft: "5px",
                  fontWeight: "700",
                }}
              >
                {formatDate(event?.registrationEndDate || "")}
              </span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
