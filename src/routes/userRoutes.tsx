import { lazy } from "react";
import { Navigate } from "react-router-dom";

import UserLayout from "../layouts/user/UserLayout";

const HomePage = lazy(() => import("../pages/user/HomePage"));
const EventPage = lazy(() => import("../pages/user/event/EventPage"));
const EventDetailPage = lazy(() => import("../pages/user/event/EventDetailPage"));
const OrgPage = lazy(() => import("../pages/user/org/OrgPage"));
const MyTicketsPage = lazy(() => import("../pages/user/MyTicketsPage"));

export const userRoutes = [
  {
    path: "/app",
    element: <UserLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "events",
        element: <EventPage />,
      },
      {
        path: "events/:eventId",
        element: <EventDetailPage />,
      },
      {
        path: "organizations",
        element: <OrgPage />,
      },
      {
        path: "organizations/:slug",
        element: <OrgPage />,
      },
      {
        path: "tickets",
        element: <MyTicketsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/app" replace />,
      },
    ],
  },
];
