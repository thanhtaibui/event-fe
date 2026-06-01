import { useEventById } from "../../hooks/admin/event/useEventById";

interface StatsCardProps {
  id: string;
}
export const StatsCard: React.FC<StatsCardProps> = ({ id }) => {
  const { data: event } = useEventById(id);

  return (
    <div className="event-summary-card">
      <div className="summary-item">
        <div className="summary-icon purple">
          <img
            width="24"
            height="24"
            src="https://img.icons8.com/ios-glyphs/30/organization.png"
            alt="organization"
          />
        </div>
        <div className="summary-content">
          <span className="summary-label">Organization</span>
          <div className="summary-value">{event?.organization?.name}</div>
        </div>
      </div>
      <div className="summary-item">
        <div className="summary-icon blue">
          <img
            width="24"
            height="24"
            src="https://img.icons8.com/ios-glyphs/30/group.png"
            alt="group"
          />
        </div>
        <div className="summary-content">
          <span className="summary-label">Capacity</span>
          <div className="summary-value">
            {event?.soldTickets}/{event?.capacity}
          </div>
        </div>
      </div>
    </div>
  );
};
