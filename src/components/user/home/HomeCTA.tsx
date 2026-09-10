import { ArrowRight, CalendarDays, TrendingUp, UsersRound } from "lucide-react";

import "../../../styles/user/home/homeCTA.css";

const growVisual = "/bg-grow.png";

export default function HomeCTA() {
  return (
    <section className="user-home-cta" aria-label="Growing organizations">
      <div className="user-home-cta__layout">
        <div className="user-home-cta__copy" data-reveal="true">
          <span className="user-home-cta__eyebrow">
            Built for growing organizations
          </span>
          <h2 className="user-home-cta__title">
            Built for growing <span>organizations.</span>
          </h2>
          <p className="user-home-cta__subtitle">
            Designed for universities, clubs, companies, NGOs, and communities
            of all sizes.
          </p>

          <div className="user-home-cta__miniStats" aria-label="Monthly growth">
            <article>
              <span>This Month</span>
              <strong>24</strong>
              <small>
                <CalendarDays size={14} aria-hidden="true" />
                Events
              </small>
            </article>
            <article>
              <span>Growth</span>
              <strong>+18%</strong>
              <small>
                <TrendingUp size={14} aria-hidden="true" />
                Attendees
              </small>
            </article>
          </div>

          <a className="user-home-cta__link" href="/register-organization">
            Register organization
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>

        <div className="user-home-cta__visual" data-reveal="true">
          <img src={growVisual} alt="Growing organization system layers" />
          <div className="user-home-cta__floatingCard">
            <UsersRound size={18} aria-hidden="true" />
            <span>Teams, events, members, and insights together.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
