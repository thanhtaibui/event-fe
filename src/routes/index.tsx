import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainAdminLayout } from "../layouts/MainAdminLayout";
import NotFoundPage from "../pages/NotFoundPage";
import AuthLayout from "../layouts/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";
import Dashboard from "../pages/admin/Dashboard";
import User from "../pages/admin/User";
import Role from "../pages/admin/Role";
import Event from "../pages/admin/event/Event";

import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import Report from "../pages/admin/Report";
import Organization from "../pages/admin/org/Organization";
import OrganizationDetail from "../pages/admin/org/OrganizationDetail";
import EventDetail from "../pages/admin/event/EventDetail";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <LoginPage />,
      },
    ],
  },
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
        element: <Navigate to="/dashboard" replace />,
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
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
