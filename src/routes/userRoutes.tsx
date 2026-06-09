import { Navigate } from "react-router-dom";

import UserLayout from "../layouts/user/UserLayout";

import HomePage from "../pages/user/HomePage";

export const userRoutes = [
  {
    path: "/",
    element: <UserLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "events",
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
];
