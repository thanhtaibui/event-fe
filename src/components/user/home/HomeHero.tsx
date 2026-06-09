import { HOME_CONTENT } from "../../../data/user/homeContent";
import heroGlobe from "../../../../public/bg-earth-2.png";

import "../../../styles/user/homeHero.css";

export default function HomeHero() {
  return (
    <section className="user-home-hero" aria-label="Home hero">
      <div className="user-home-hero__grid">
        <div className="user-home-hero__copy" data-reveal="true">
          <div className="user-home-hero__badge">
            All-in-one event & community platform
          </div>

          <h1 className="user-home-hero__title">
            Bring people <br />
            <span>together.</span>
          </h1>

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
              href="/events"
            >
              {HOME_CONTENT.hero.primaryCta}
              <img
                width="35"
                height="35"
                src="https://img.icons8.com/ios-filled/50/circled-down-2.png"
                alt="circled-down-2"
              />
            </a>

            <a
              className="user-home-hero__btn user-home-hero__btn--ghost"
              href="/events"
            >
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
              Trusted by 10,000+ organizations <br />
              and communities worldwide
            </p>
          </div>
        </div>

        <div className="user-home-hero__visual" data-reveal="true">
          <img
            src={heroGlobe}
            alt="Purple community globe"
            className="user-home-hero__globeImage"
          />

          <div className="user-home-hero__eventCard user-home-hero__eventCard--1">
            <div className="user-home-hero__thumb" />
            <div>
              <strong>Tech Summit 2026</strong>
              <span>May 20, 2026 · San Francisco</span>
              <small>2.4K Going</small>
            </div>
          </div>

          <div className="user-home-hero__eventCard user-home-hero__eventCard--2">
            <div className="user-home-hero__thumb" />
            <div>
              <strong>Design Conference</strong>
              <span>Aug 10, 2026 · New York</span>
              <small>1.2K Going</small>
            </div>
          </div>

          <div className="user-home-hero__eventCard user-home-hero__eventCard--3">
            <div className="user-home-hero__thumb" />
            <div>
              <strong>Music Festival</strong>
              <span>Jun 21, 2026 · Miami</span>
              <small>3.5K Going</small>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="user-home-hero__brandRow" aria-label="Trusted brands">
        <span>Google</span>
        <span>Microsoft</span>
        <span>Airbnb</span>
        <span>Spotify</span>
        <span>Dropbox</span>
        <span>Slack</span>
      </div> */}
    </section>
  );
}
