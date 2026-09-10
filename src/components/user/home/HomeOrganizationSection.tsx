import {
  CalendarDays,
  Ticket,
  UsersRound,
  WalletCards,
} from "lucide-react";

import "../../../styles/user/home/homeOrganizationSection.css";

const eventFlow = [
  {
    title: "Publish",
    description: "Set up a clean event page with date, place, capacity and ticket tiers.",
    icon: CalendarDays,
  },
  {
    title: "Invite",
    description: "Bring attendees in with simple invitations and organized guest tracking.",
    icon: UsersRound,
  },
  {
    title: "Ticket",
    description: "Keep every registration clear from purchase to check-in.",
    icon: Ticket,
  },
  {
    title: "Operate",
    description: "Monitor status, participants and event readiness in one calm workflow.",
    icon: WalletCards,
  },
];

export default function HomeOrganizationSection() {
  return (
    <section className="user-home-org" aria-label="Event operating flow">
      <div className="user-home-org__layout">
        <div className="user-home-org__copy" data-reveal="true">
          <span className="user-home-org__eyebrow">Event workflow</span>
          <h2 className="user-home-org__title">
            From idea to check-in, your event stays <span>organized.</span>
          </h2>
          <p className="user-home-org__subtitle">
            Eventix keeps the important parts of an event easy to understand:
            publishing, invites, tickets, attendance and day-of operations.
          </p>
        </div>

        <div className="user-home-org__flow" data-reveal="true">
          {eventFlow.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className="user-home-org__flowCard" key={item.title}>
                <span className="user-home-org__step">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="user-home-org__flowIcon">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
