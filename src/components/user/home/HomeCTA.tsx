import { HOME_CONTENT } from "../../../data/user/homeContent";

import "../../../styles/user/homeCTA.css";

export default function HomeCTA() {
  return (
    <section className="user-home-cta" aria-label="CTA">
      <div className="user-home-cta__layout">
        <div className="user-home-cta__copy" data-reveal="true">
          <h2 className="user-home-cta__title">{HOME_CONTENT.cta.title}</h2>
          <p className="user-home-cta__subtitle">{HOME_CONTENT.cta.subtitle}</p>

          <div
            className="user-home-cta__actions"
            role="group"
            aria-label="CTA actions"
          >
            <a
              className="user-home-cta__btn user-home-cta__btn--primary"
              href="/events"
            >
              {HOME_CONTENT.cta.primaryCta}
              <img
                width="35"
                height="35"
                alt="circled-down-2"
                src="https://img.icons8.com/ios-filled/50/circled-down-2.png"
              ></img>
            </a>
          </div>
        </div>
        <div className="user-home-cta__features" data-reveal="true">
          <div className="user-home-cta__feature">
            <div>
              <h4>Create Your Organization</h4>
              <p>Establish your brand and community identity.</p>
            </div>
          </div>

          <div className="user-home-cta__feature">
            <div>
              <h4>Host Engaging Events</h4>
              <p>Create experiences that bring people together.</p>
            </div>
          </div>

          <div className="user-home-cta__feature">
            <div>
              <h4>Grow Your Members</h4>
              <p>Turn attendees into active community participants.</p>
            </div>
          </div>

          <div className="user-home-cta__feature">
            <div>
              <h4>Build Lasting Impact</h4>
              <p>Keep your community thriving beyond every event.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
