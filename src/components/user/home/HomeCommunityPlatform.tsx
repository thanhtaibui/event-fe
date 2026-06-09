import { HOME_CONTENT } from "../../../data/user/homeContent";

import "../../../styles/user/homeCommunityPlatform.css";
import platformGlobe from "../../../../public/bg-platform.png";

export default function HomeCommunityPlatform() {
  return (
    <section className="user-home-platform" aria-label="Community platform">
      <div className="user-home-platform__layout">
        <div className="user-home-platform__visual" data-reveal="true">
          <img
            src={platformGlobe}
            alt=""
            className="user-home-hero__platformGlobe"
          />
        </div>
        <div className="user-home-platform__copy" data-reveal="true">
          <h2 className="user-home-platform__title">
            {HOME_CONTENT.platform.title}
          </h2>
          <p className="user-home-platform__subtitle">
            {HOME_CONTENT.platform.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
