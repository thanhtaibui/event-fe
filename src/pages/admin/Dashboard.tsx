import type { ReactNode } from "react";
import "../../styles/admin/dashboard.css";
import PieChart from "../../components/admin/dashboard/PieChart";
import DashboardCard from "../../components/admin/dashboard/DashboardCard";
import { useDashboardInfo } from "../../hooks/admin/useDashboard";
import { useOrgDashboardInfo } from "../../hooks/org/useDashboard";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import { Link, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Inbox,
  ListChecks,
  Plus,
  Ticket,
  UsersRound,
} from "lucide-react";

type DashboardCardItem = {
  key: string;
  title: string;
  value: string | number;
};

type DashboardListItem = Record<string, any>;

const adminCardOrder = ["organizations", "events", "revenue", "tickets"];
const orgCardOrder = ["events", "revenue", "tickets"];

const cardIcons: Record<string, ReactNode> = {
  organizations: <Building2 size={22} aria-hidden="true" />,
  users: <UsersRound size={22} aria-hidden="true" />,
  events: <CalendarDays size={22} aria-hidden="true" />,
  reports: <ClipboardList size={22} aria-hidden="true" />,
  memberships: <UsersRound size={22} aria-hidden="true" />,
  revenue: <CircleDollarSign size={22} aria-hidden="true" />,
  tickets: <Ticket size={22} aria-hidden="true" />,
};

function getOrderedCards(cards: DashboardCardItem[], isOrgWorkspace: boolean) {
  const order = isOrgWorkspace ? orgCardOrder : adminCardOrder;
  return order
    .map((key) => cards.find((item) => item.key === key))
    .filter(Boolean) as DashboardCardItem[];
}

function getDashboardList(data: any, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as DashboardListItem[];
    if (Array.isArray(data?.data?.[key])) return data.data[key] as DashboardListItem[];
  }

  return [];
}

function getItemTitle(item: DashboardListItem) {
  return (
    item.title ||
    item.name ||
    item.eventName ||
    item.organizationName ||
    item.message ||
    item.code ||
    item.id ||
    "Activity"
  );
}

function getItemMeta(item: DashboardListItem) {
  return (
    item.status ||
    item.createdAt ||
    item.updatedAt ||
    item.date ||
    item.type ||
    item.email ||
    ""
  );
}

function hasUsefulChartData(items: any[]) {
  return items.some((item) => Number(item?.value) > 0);
}

export default function Dashboard() {
  const { slug } = useParams();
  const isOrgWorkspace = Boolean(slug);
  const adminDashboard = useDashboardInfo(!isOrgWorkspace);
  const orgDashboard = useOrgDashboardInfo(slug, isOrgWorkspace);
  const { data, loading } = isOrgWorkspace ? orgDashboard : adminDashboard;
  const cards = (data?.cards ?? []) as DashboardCardItem[];
  const visibleCards = getOrderedCards(cards, isOrgWorkspace);
  const pieChart = data?.pieChart ?? [];
  const hasPieChartData = hasUsefulChartData(pieChart);
  const recentEvents = getDashboardList(data, ["recentEvents", "latestEvents"]);
  const recentOrders = getDashboardList(data, ["recentOrders", "orders"]);
  const notifications = getDashboardList(data, ["notifications", "recentNotifications"]);
  const activityItems = getDashboardList(data, ["recentActivity", "activities", "activity"]);
  const recentActivity = [
    ...activityItems,
    ...recentEvents,
    ...recentOrders,
    ...notifications,
  ].slice(0, 6);
  const basePath = isOrgWorkspace && slug ? `/org/${slug}` : "/admin";
  const organizationRoute = isOrgWorkspace && slug
    ? `/org/${slug}/profile`
    : "/admin/organizations";
  const primaryMetric = visibleCards[0];

  if (loading)
    return (
      <div>
        <AdminSkeleton variant="dashboard" cards={isOrgWorkspace ? 3 : 4} />
      </div>
    );
  return (
    <div
      className={`dashboard ${
        isOrgWorkspace ? "dashboard--org" : "dashboard--admin"
      }`}
    >
      <section className="dashboard-hero" aria-label="Dashboard overview">
        <div className="dashboard-hero__content">
          <span className="dashboard-eyebrow">
            Eventix Organizer Control Center
          </span>
          <h1>
            {isOrgWorkspace
              ? "Manage this organization with a clear operating view."
              : "Monitor platform health from one focused command center."}
          </h1>
          <p>
            Track real dashboard data, review operational signals, and jump to
            the admin workflows that keep events moving.
          </p>

          <div className="dashboard-hero__actions">
            <Link className="dashboard-hero__primary" to={`${basePath}/events`}>
              <Plus size={17} aria-hidden="true" />
              Create Event
            </Link>
            <Link className="dashboard-hero__secondary" to={`${basePath}/events`}>
              <ListChecks size={17} aria-hidden="true" />
              Manage Events
            </Link>
            <Link className="dashboard-hero__secondary" to={organizationRoute}>
              <Building2 size={17} aria-hidden="true" />
              Manage Organization
            </Link>
          </div>
        </div>

        {primaryMetric && (
          <div className="dashboard-hero__metric">
            <span>{primaryMetric.title}</span>
            <strong>
              {typeof primaryMetric.value === "number"
                ? primaryMetric.value.toLocaleString()
                : primaryMetric.value}
            </strong>
            <small>Live API data</small>
          </div>
        )}
      </section>

      <section className="dashboard-cards" id="dashboard-events" aria-label="Dashboard KPI">
        {visibleCards.map((item: any) => (
          <DashboardCard
            key={item.key}
            title={item.title}
            value={item.value}
            icon={cardIcons[item.key] || <BarChart3 size={22} aria-hidden="true" />}
          />
        ))}
      </section>

      <section className="dashboard-main-grid" aria-label="Dashboard analytics and activity">
        <div className="chart-box dashboard-analytics" id="dashboard-analytics">
          <div className="chart-box__header">
            <div>
              <span className="dashboard-eyebrow">Analytics</span>
              <h2>Event status distribution</h2>
            </div>
            {hasPieChartData && (
              <span className="chart-pill">
                <BarChart3 size={15} aria-hidden="true" />
                Live data
              </span>
            )}
          </div>

          {hasPieChartData ? (
            <PieChart
              title="Event status"
              data={pieChart.map((item: any) => ({
                label: item.label,
                value: item.value,
                color: item.color,
              }))}
            />
          ) : (
            <div className="dashboard-empty">
              <Inbox size={34} aria-hidden="true" />
              <h3>No data available</h3>
              <p>Data will appear when available.</p>
            </div>
          )}
        </div>

        <aside className="chart-box dashboard-activity">
          <div className="chart-box__header">
            <div>
              <span className="dashboard-eyebrow">Recent activity</span>
              <h2>Latest operations</h2>
            </div>
            <Bell size={18} aria-hidden="true" />
          </div>

          <div className="dashboard-activity__list">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div className="dashboard-activity__item" key={item.id || index}>
                  <span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{getItemTitle(item)}</strong>
                    {getItemMeta(item) && <small>{getItemMeta(item)}</small>}
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty dashboard-empty--compact">
                <Inbox size={30} aria-hidden="true" />
                <h3>No data available</h3>
                <p>Data will appear when available.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
