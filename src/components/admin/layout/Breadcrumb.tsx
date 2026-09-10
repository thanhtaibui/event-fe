import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

export const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const isOrgWorkspace = segments[0] === "org";

  const module = isOrgWorkspace ? segments[2] : segments[1];
  const basePath = isOrgWorkspace && segments[1] ? `/org/${segments[1]}` : "/admin";
  const isDetail = isOrgWorkspace
    ? segments.length > 3
    : segments.length > 2;

  const labels: Record<string, string> = {
    organizations: "Organizations",
    users: "Users",
    events: "Events",
    reports: "Reports",
    roles: "Roles",
    membership: "Membership",
    profile: "Organization Profile",
    verifications: "Verifications",
  };

  const moduleLabel = labels[module] || "";

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      separator="/"
      sx={{
        "& .MuiBreadcrumbs-separator": { color: "white", fontWeight: "bold" },
      }}
    >
      <Link
        component={RouterLink}
        to={`${basePath}/dashboard`}
        underline="hover"
        sx={{ color: "white" }}
      >
        Dashboard
      </Link>

      {isDetail && moduleLabel && module !== "profile" && (
        <Link
          component={RouterLink}
          to={`${basePath}/${module}`}
          underline="hover"
          sx={{ color: "white" }}
        >
          {moduleLabel}
        </Link>
      )}

      {moduleLabel && (
        <Typography sx={{ color: "white", fontWeight: 500 }}>
          {isDetail ? "Detail" : moduleLabel}
        </Typography>
      )}
    </Breadcrumbs>
  );
};
