import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

export const Breadcrumb = () => {
  const location = useLocation();
  const path = location.pathname;
  let current = "";

  if (path.includes("users")) current = "Users";
  else if (path.includes("events")) current = "Events";
  else if (path.includes("dashboard")) current = "";

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      sx={{
        "& .MuiBreadcrumbs-separator": {
          color: "white", // Đổi thành màu tím accent của bạn cho nổi
          fontWeight: "bold",
        },
      }}
    >
      <Link component={RouterLink} to="/admin/dashboard" underline="hover">
        Dashboard
      </Link>
      {current && <Typography sx={{ color: "white" }}>{current}</Typography>}
    </Breadcrumbs>
  );
};
