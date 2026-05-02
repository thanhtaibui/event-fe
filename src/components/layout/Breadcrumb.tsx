import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

export const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const module = segments[1]; // organizations, users, v.v.
  const isDetail = segments.length > 2;

  // Map label cho đẹp
  const labels: Record<string, string> = {
    organizations: "Organizations",
    users: "Users",
    events: "Events",
    reports: "Reports",
    roles: "roles",
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
      {/* 1. Luôn có Link Dashboard */}
      <Link
        component={RouterLink}
        to="/admin/dashboard"
        underline="hover"
        sx={{ color: "white" }}
      >
        Dashboard
      </Link>

      {/* 2. Nếu là trang DETAIL: Hiện thêm 1 Link để bấm quay lại trang danh sách */}
      {isDetail && moduleLabel && (
        <Link
          component={RouterLink}
          to={`/admin/${module}`}
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
