import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "../pages/NotFoundPage";
import AuthLayout from "../layouts/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";
// import RegisterPage from "../pages/auth/RegisterPage";

import AcceptInvitePage from "../pages/invite/AcceptInvitePage";

import { adminRoutes } from "./adminRoutes";
import { userRoutes } from "./userRoutes";
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

  ...adminRoutes,
  ...userRoutes,
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
