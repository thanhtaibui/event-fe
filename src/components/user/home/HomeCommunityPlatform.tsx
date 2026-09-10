import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  UsersRound,
} from "lucide-react";

const platformVisual = "/bg-platform.png";
import "../../../styles/user/home/homeCommunityPlatform.css";

const platformCards = [
  {
    title: "Events",
    description: "Create and manage polished event experiences.",
    icon: CalendarDays,
    tone: "violet",
  },
  {
    title: "Members",
    description: "Grow your audience and keep people connected.",
    icon: UsersRound,
    tone: "blue",
  },
  {
    title: "Organizations",
    description: "Run teams, roles, and communities in one place.",
    icon: Building2,
    tone: "mint",
  },
  {
    title: "Analytics",
    description: "Understand momentum with clear operating signals.",
    icon: BarChart3,
    tone: "peach",
  },
];

export default function HomeCommunityPlatform() {
  return (
    <section className="user-home-platform" aria-label="Eventix modules">
      <div className="user-home-platform__layout">
        <div className="user-home-platform__intro" data-reveal="true">
          <span className="user-home-platform__eyebrow">
            All-in-one platform
          </span>
          <h2 className="user-home-platform__title">
            Everything you need to build <span>communities.</span>
          </h2>
          <p className="user-home-platform__subtitle">
            From event creation to member management, invitations, tickets,
            check-in and analytics. Everything in one seamless platform.
          </p>
        </div>

        <div className="user-home-platform__visual" data-reveal="true">
          <img
            src={platformVisual}
            alt="Eventix platform modules"
            className="user-home-platform__image"
          />
        </div>

        <div className="user-home-platform__cards" data-reveal="true">
          {platformCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className={`user-home-platform__card user-home-platform__card--${card.tone}`}
                key={card.title}
              >
                <div className="user-home-platform__icon">
                  <Icon size={28} aria-hidden="true" />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <span aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
