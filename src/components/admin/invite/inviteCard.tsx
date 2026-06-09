import { useState } from "react";
import { useInviteByIdEvent } from "../../../hooks/admin/event/useInvites";
import { InvitePopup } from "./InvitePopup";
import { useEventById } from "../../../hooks/admin/event/useEventById";

interface InviteCardProps {
  id: string;
}
export const InviteCard: React.FC<InviteCardProps> = ({ id }) => {
  const { data: invites } = useInviteByIdEvent(id);
  const [showPopup, setShowPopup] = useState<"inviteEmail" | null>();
  const { data: event } = useEventById(id);

  const calcPercent = (part: number, total: number): number => {
    if (!total || total === 0) return 0;
    return Number(((part / total) * 100).toFixed(1));
  };

  return (
    <div className="invites-card">
      {showPopup === "inviteEmail" && (
        <InvitePopup
          isOpen={true}
          eventName={event.title || "Event"}
          eventId={event.id || ""}
          onClosePopup={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
          }}
        />
      )}
      <div className="header-invites">
        <img
          width="35"
          height="35"
          src="https://img.icons8.com/nolan/64/invite.png"
          alt="invite"
        />
        <h3 className="section-title" style={{ color: "#1e293b" }}>
          Invites Summary
        </h3>
      </div>
      <div className="total-invites">
        <div className="img-send">
          <img
            width="30"
            height="30"
            src="https://img.icons8.com/pulsar-gradient/35/filled-sent.png"
            alt="filled-sent"
          />
        </div>
        <div className="note">
          <h3 className="section-title">Total Invitations</h3>
          <p>Emails send to waitlist</p>
        </div>

        <div className="invites-number" title={`${invites?.totalInvites}`}>
          {invites?.totalInvites}
        </div>
      </div>

      <div className="invites-stats order-6">
        <div className="stat-item full-width accepted">
          <div className="stat-label-accepted" style={{ width: "40%" }}>
            Accepted <br />
            <span style={{ marginTop: "0.25rem" }}>Confirmed Attendance</span>
          </div>
          <div className="stat-value stat-accepted">
            {calcPercent(invites?.acceptedInvites, invites?.totalInvites)}%
          </div>
        </div>
        <div className="stat-item pending">
          <div className="stat-label-pending">Pending</div>
          <div className="stat-value stat-pending">
            {calcPercent(invites?.pendingInvites, invites?.totalInvites)}%
          </div>
        </div>
        <div className="stat-item rejected">
          <div className="stat-label-rejected">Rejected</div>
          <div className="stat-value stat-rejected">
            {calcPercent(invites?.rejectedInvites, invites?.totalInvites)}%
          </div>
        </div>
      </div>
      <button
        className="manage-guests-btn"
        onClick={() => setShowPopup("inviteEmail")}
      >
        Manage Guest List
      </button>
    </div>
  );
};
