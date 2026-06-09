import { HOME_CONTENT } from "../../../data/user/homeContent";

import "../../../styles/user/homeOrganizationSection.css";
import growGlobe from "../../../../public/bg-grow.png";

export default function HomeOrganizationSection() {
  return (
    <section className="user-home-org" aria-label="Organization">
      <div className="user-home-org__layout">
        <div className="user-home-org__copy" data-reveal="true">
          <h2 className="user-home-org__title">{HOME_CONTENT.org.title}</h2>
          <p className="user-home-org__subtitle">{HOME_CONTENT.org.subtitle}</p>
        </div>

        <div className="user-home-org__visual" data-reveal="true">
          <img src={growGlobe} alt="" className="user-home-hero__growGlobe" />
        </div>
      </div>
    </section>
  );
}
