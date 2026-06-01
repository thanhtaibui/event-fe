import React from "react";

import "../../styles/event/invite-popup.css";

export type EmailChipProps = {
  email: string;
  onRemove: (email: string) => void;
};

const getInitials = (email: string) => {
  const v = email.split("@")[0] || "";
  const parts = v.split(/[._\-\s]+/g).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return (v[0] || "").toUpperCase();
};

const hashToHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
};

export const EmailChip: React.FC<EmailChipProps> = ({ email, onRemove }) => {
  const initials = getInitials(email);
  const hue = hashToHue(email);
  return (
    <div className="invite-recipient-chip">
      <div
        className="invite-recipient-chip__avatar"
        style={{
          background: `hsl(${hue} 70% 90% / 1)`,
          color: `hsl(${hue} 55% 30% / 1)`,
        }}
        aria-hidden
      >
        {initials}
      </div>
      <div className="invite-recipient-chip__meta">
        <div className="invite-recipient-chip__name">{email}</div>
      </div>
      <button
        type="button"
        className="invite-recipient-chip__remove"
        aria-label={`Remove ${email}`}
        onClick={() => onRemove(email)}
      >
        ×
      </button>
    </div>
  );
};
