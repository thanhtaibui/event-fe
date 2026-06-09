import HomeHero from "../../components/user/home/HomeHero";
import HomeCommunityPlatform from "../../components/user/home/HomeCommunityPlatform";

import HomeOrganizationSection from "../../components/user/home/HomeOrganizationSection";
import HomeCTA from "../../components/user/home/HomeCTA";

import "../../styles/user/home.css";

export default function HomePage() {
  return (
    <div className="user-home">
      <HomeHero />
      <HomeCommunityPlatform />
      {/* <HomeFeatureShowcase /> */}
      {/* <HomeCommunityNetwork /> */}
      <HomeOrganizationSection />
      <HomeCTA />
    </div>
  );
}
