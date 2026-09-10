import { ArrowRight, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type TopRankedOrg = {
  rank: number;
  logo: string;
  name: string;
  members_count: string;
  following: boolean;
};

interface OrgSidebarProps {
  topOrgs: TopRankedOrg[];
}

function RankAvatar({ item }: { item: TopRankedOrg }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="org-sidebar__rank-avatar org-sidebar__rank-avatar--fallback">
        {item.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="org-sidebar__rank-avatar"
      src={item.logo}
      alt={item.name}
      onError={() => setFailed(true)}
    />
  );
}

export default function OrgSidebar({ topOrgs }: OrgSidebarProps) {
  return (
    <aside className="org-sidebar">
      <div className="org-sidebar__panel">
        <div className="org-sidebar__title-row">
          <Trophy size={19} aria-hidden="true" />
          <h2>Top Organizations</h2>
        </div>
        <ul className="org-sidebar__rank-list">
          {topOrgs.map((item) => (
            <li key={item.rank} className="org-sidebar__rank-item">
              <span className="org-sidebar__rank-number">{item.rank}</span>
              <RankAvatar item={item} />
              <div className="org-sidebar__rank-meta">
                <p>{item.name}</p>
                <span>{item.members_count}</span>
              </div>
              <button className="org-sidebar__rank-follow">
                {item.following ? "Following" : "Follow"}
              </button>
            </li>
          ))}
        </ul>
        <a className="org-sidebar__view-all" href="#">
          View all rankings
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>

      <div className="org-sidebar__promo">
        <div className="org-sidebar__promo-art" aria-hidden="true">
          <div className="org-sidebar__promo-glow" />
          <div className="org-sidebar__promo-shape" />
        </div>
        <div className="org-sidebar__promo-content">
          <p className="org-sidebar__promo-eyebrow">
            Ready to build your community?
          </p>
          <h3>Create and launch a futuristic organization today.</h3>
          <Link className="org-sidebar__promo-btn" to="/register-organization">
            Create Organization
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
