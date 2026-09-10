import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

import { adminRoutes } from "./adminRoutes";
import { userRoutes } from "./userRoutes";

const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const OrgRegisterPage = lazy(() => import("../pages/auth/OrgRegisterPage"));
const AcceptInvitePage = lazy(() => import("../pages/invite/AcceptInvitePage"));
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
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
    path: "/register",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "/register-organization",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <OrgRegisterPage />,
      },
    ],
  },

  ...adminRoutes,
  ...userRoutes,
  {
    path: "/events",
    element: <Navigate to="/app/events" replace />,
  },
  {
    path: "/organizations",
    element: <Navigate to="/app/organizations" replace />,
  },
  {
    path: "/tickets",
    element: <Navigate to="/app/tickets" replace />,
  },
  {
    path: "/events/accept",
    element: <AcceptInvitePage />,
  },
  {
    path: "/events/reject",
    element: <AcceptInvitePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
