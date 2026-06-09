import { Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import { MainAdminLayout } from "../layouts/admin/MainAdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import User from "../pages/admin/User";
import Role from "../pages/admin/Role";
import Report from "../pages/admin/Report";
import Organization from "../pages/admin/org/Organization";
import OrganizationDetail from "../pages/admin/org/OrganizationDetail";
import Event from "../pages/admin/event/Event";
import EventDetail from "../pages/admin/event/EventDetail";

export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <MainAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <User />,
      },
      {
        path: "reports",
        element: <Report />,
      },
      {
        path: "roles",
        element: <Role />,
      },
      {
        path: "events",
        children: [
          {
            index: true,
            element: <Event />,
          },
          {
            path: ":id",
            element: <EventDetail />,
          },
        ],
      },
      {
        path: "organizations",
        children: [
          {
            index: true,
            element: <Organization />,
          },
          {
            path: ":slug",
            element: <OrganizationDetail />,
          },
        ],
      },
    ],
  },
];
