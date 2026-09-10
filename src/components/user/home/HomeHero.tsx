import { HOME_CONTENT } from "../../../data/user/homeContent";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  PlusCircle,
  Users,
} from "lucide-react";

import "../../../styles/user/home/homeHero.css";

const heroGlobe = "/bg-earth-2.png";

export default function HomeHero() {
  return (
    <section className="user-home-hero" aria-label="Home hero">
      <div className="user-home-hero__ambient user-home-hero__ambient--one" />
      <div className="user-home-hero__ambient user-home-hero__ambient--two" />

      <div className="user-home-hero__grid">
        <div className="user-home-hero__copy" data-reveal="true">
          <div className="user-home-hero__badge">
            Premium event discovery
          </div>

          <h1 className="user-home-hero__title">{HOME_CONTENT.hero.title}</h1>

          <p className="user-home-hero__subtitle">
            {HOME_CONTENT.hero.subtitle}
          </p>

          <div
            className="user-home-hero__actions"
            role="group"
            aria-label="Hero actions"
          >
            <a
              className="user-home-hero__btn user-home-hero__btn--primary"
              href="/app/events"
            >
              {HOME_CONTENT.hero.primaryCta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>

            <a
              className="user-home-hero__btn user-home-hero__btn--ghost"
              href="/register-organization"
            >
              <PlusCircle size={18} aria-hidden="true" />
              {HOME_CONTENT.hero.secondaryCta}
            </a>
          </div>

          <div className="user-home-hero__trust">
            <div className="user-home-hero__avatars">
              <span />
              <span />
              <span />
              <span />
            </div>

            <p>
              Trusted by organizers, teams, and communities launching real
              experiences.
            </p>
          </div>
        </div>

        <div className="user-home-hero__visual" data-reveal="true">
          <div className="user-home-hero__mediaFrame">
            <img
              src={heroGlobe}
              alt="Eventix global community visual"
              className="user-home-hero__globeImage"
            />

            <div className="user-home-hero__liveBadge">
              <span />
              Live events
            </div>

            <div className="user-home-hero__glassPanel">
              <div>
                <small>Featured this week</small>
                <strong>Community Music Festival</strong>
              </div>
              <div className="user-home-hero__panelMeta">
                <span>
                  <CalendarDays size={15} aria-hidden="true" />
                  Jun 21
                </span>
                <span>
                  <MapPin size={15} aria-hidden="true" />
                  Miami
                </span>
                <span>
                  <Users size={15} aria-hidden="true" />
                  3.5K going
                </span>
              </div>
            </div>

            <div className="user-home-hero__metricCard user-home-hero__metricCard--left">
              <strong>10K+</strong>
              <span>Events published</span>
            </div>

            <div className="user-home-hero__metricCard user-home-hero__metricCard--right">
              <strong>50K+</strong>
              <span>Active attendees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
