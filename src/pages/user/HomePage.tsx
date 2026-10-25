import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Search,
  ShieldCheck,
  Ticket,
  UsersRound,
} from "lucide-react";

import "../../styles/user/home/home.css";

const trustPoints = [
  { label: "Verified organizers", Icon: ShieldCheck },
  { label: "Secure ticketing", Icon: Ticket },
  { label: "Growing communities", Icon: UsersRound },
] as const;

const workflowItems = [
  {
    number: "01",
    title: "Discover",
    description: "Find events by community, topic and organizer context.",
    Icon: Search,
  },
  {
    number: "02",
    title: "Join",
    description: "Reserve tickets with a clear, secure flow.",
    Icon: Ticket,
  },
  {
    number: "03",
    title: "Connect",
    description: "Follow organizers and keep every experience in one place.",
    Icon: UsersRound,
  },
] as const;

const organizerFeatures = [
  {
    title: "Create events",
    description: "Build and publish event pages in minutes.",
    Icon: CalendarDays,
  },
  {
    title: "Manage attendees",
    description: "Keep tickets, participants and check-in organized.",
    Icon: UsersRound,
  },
  {
    title: "Track performance",
    description: "Understand how your events are performing.",
    Icon: BarChart3,
  },
] as const;

export default function HomePage() {
  return (
    <main className="user-home">
      <section className="home-hero" aria-label="Eventix home">
        <div className="home-shell home-hero__grid">
          <div className="home-hero__copy" data-home-reveal="true">
            <h1>
              Events made <span className="home-hero__highlight">simple.</span>
            </h1>

            <p>
              Discover, join and manage meaningful events — all in one place.
            </p>

            <div className="home-actions">
              <Link className="home-btn home-btn--primary" to="/app/events">
                Explore Events
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                className="home-btn home-btn--secondary"
                to="/register-organization"
              >
                Become an Organizer
              </Link>
            </div>

            <div className="home-trustList" aria-label="Eventix trust points">
              {trustPoints.map(({ label, Icon }) => (
                <div className="home-trustItem" key={label}>
                  <span className="home-trustIcon">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="home-heroVisual" aria-label="Eventix visual">
            <div className="home-heroVisual__glow" aria-hidden="true" />
            <img
              src="/bg-earth-2.png"
              alt="Eventix global community visual"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section className="home-section home-how" aria-label="How Eventix works">
        <div className="home-shell">
          <div className="home-sectionHeader">
            <h2>From discovery to attendance in a few clear steps.</h2>
          </div>

          <div className="home-workflow">
            {workflowItems.map(({ number, title, description, Icon }) => (
              <article className="home-workflow__item" key={title}>
                <div className="home-workflow__top">
                  <span className="home-cardNumber">{number}</span>
                  <span className="home-iconBox">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-platform" aria-label="Eventix platform support">
        <div className="home-shell home-platform__grid">
          <div className="home-platform__copy">
            <h2>One platform for the event experience.</h2>
            <p>
              Discover events, manage experiences and give organizers the tools
              they need to build stronger communities.
            </p>
          </div>

          <div className="home-platformVisual">
            <img
              src="/bg-platform.png"
              alt="Eventix platform capabilities"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="home-section home-organizer" aria-label="Organizer onboarding">
        <div className="home-shell home-organizer__grid">
          <div className="home-organizer__copy">
            <h2>Turn your ideas into events.</h2>
            <p>
              Create your organization, publish events and manage everything
              from one workspace.
            </p>

            <Link
              className="home-btn home-btn--primary"
              to="/register-organization"
            >
              Become an Organizer
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="home-growVisual">
            <img
              src="/bg-grow.png"
              alt="Organization, events, members and community growth flow"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="home-section home-why" aria-label="Everything you need to run great events">
        <div className="home-shell">
          <div className="home-sectionHeader">
            <h2>Everything you need to run great events.</h2>
          </div>

          <div className="home-featureList">
            {organizerFeatures.map(({ title, description, Icon }) => (
              <article key={title}>
                <span className="home-iconBox">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-finalCta" aria-label="Start hosting with Eventix">
        <div className="home-shell home-finalCta__inner">
          <div>
            <h2>Ready to host your first event?</h2>
            <p>
              Create your organization and start building memorable experiences.
            </p>
          </div>

          <Link
            className="home-btn home-btn--primary"
            to="/register-organization"
          >
            Become an Organizer
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
