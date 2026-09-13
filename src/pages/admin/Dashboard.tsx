import "../../styles/admin/dashboard.css";
import PieChart from "../../components/admin/dashboard/PieChart";
import DashboardCard from "../../components/admin/dashboard/DashboardCard";
// import LineChart from "../../components/dashboard/LineChart";
import { useDashboardInfo } from "../../hooks/admin/useDashboard";
import { useOrgDashboardInfo } from "../../hooks/org/useDashboard";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import { useParams } from "react-router-dom";
import { BarChart3, CalendarDays, MoveRight } from "lucide-react";
export default function Dashboard() {
  const { slug } = useParams();
  const isOrgWorkspace = Boolean(slug);
  const adminDashboard = useDashboardInfo(!isOrgWorkspace);
  const orgDashboard = useOrgDashboardInfo(slug, isOrgWorkspace);
  const { data, loading } = isOrgWorkspace ? orgDashboard : adminDashboard;
  const cards = data?.cards ?? [];
  const adminCardOrder = ["organizations", "events", "revenue", "tickets"];
  const orgCardOrder = ["events", "revenue", "tickets"];
  const visibleCards = isOrgWorkspace
    ? orgCardOrder
        .map((key) => cards.find((item: any) => item.key === key))
        .filter(Boolean)
    : adminCardOrder
        .map((key) => cards.find((item: any) => item.key === key))
        .filter(Boolean);
  const pieChart = data?.pieChart ?? [];
  const revenueCard = visibleCards.find((item: any) => item.key === "revenue");
  const ticketsCard = visibleCards.find((item: any) => item.key === "tickets");
  const activityBars = [46, 68, 52, 78, 61, 88, 73];
  const trendMap: Record<string, string> = {
    organizations: "+14% so với tháng trước",
    events: "+25% so với tháng trước",
    revenue: "+18% so với tháng trước",
    tickets: "-12% so với tháng trước",
  };
  const iconMap: Record<string, string> = {
    organizations: "https://img.icons8.com/nolan/64/organization.png",
    users: "https://img.icons8.com/nolan/64/gender-neutral-user.png",
    events: "https://img.icons8.com/nolan/64/today.png",
    reports: "https://img.icons8.com/nolan/64/report-card.png",
    memberships: "https://img.icons8.com/nolan/64/conference-call.png",
    revenue: "https://img.icons8.com/nolan/64/total-sales-1.png",
    tickets: "https://img.icons8.com/nolan/64/ticket.png",
  };
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
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">
            {isOrgWorkspace ? "Organization overview" : "Admin overview"}
          </span>
          <h1>Quản lý sự kiện dễ dàng hơn</h1>
          <p>
            Theo dõi doanh thu, sự kiện, người dùng và trạng thái vận hành trong
            một màn hình gọn hơn.
          </p>
          <div className="dashboard-hero__actions">
            <a className="dashboard-hero__primary" href="#dashboard-revenue">
              <BarChart3 size={18} />
              <span>Xem báo cáo</span>
              <MoveRight size={17} />
            </a>
            <a className="dashboard-hero__secondary" href="#dashboard-events">
              <CalendarDays size={18} />
              <span>Quản lý sự kiện</span>
            </a>
          </div>
        </div>
        <div className="dashboard-hero__showcase" aria-hidden="true">
          <div className="dashboard-hero__metric">
            <span>Tạo nên những sự kiện tuyệt vời</span>
            <strong>
              {typeof revenueCard?.value === "number"
                ? revenueCard.value.toLocaleString()
                : revenueCard?.value || "0"}
            </strong>
            <small>{ticketsCard?.value || 0} tickets sold</small>
          </div>
          <div className="dashboard-hero__gem" />
          <div className="dashboard-hero__float dashboard-hero__float--one">
            <BarChart3 size={22} />
          </div>
          <div className="dashboard-hero__float dashboard-hero__float--two">
            <CalendarDays size={22} />
          </div>
        </div>
      </section>

      <div className="dashboard-cards" id="dashboard-events">
        {visibleCards.map((item: any) => (
          <DashboardCard
            key={item.key}
            title={item.title}
            value={item.value}
            trend={trendMap[item.key]}
            icon={
              <img
                width="35"
                height="35"
                src={iconMap[item.key]}
                alt={item.key}
              />
            }
          />
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-box revenue-chart" id="dashboard-revenue">
          <div className="chart-box__header">
            <div>
              <span className="dashboard-eyebrow">Performance</span>
              <h2>Xu hướng doanh thu</h2>
            </div>
            <span className="chart-pill">
              <CalendarDays size={15} />
              7 ngày qua
            </span>
          </div>
          <div className="revenue-chart__tooltip">
            <span>Thứ S</span>
            <strong>2.8M VND</strong>
          </div>
          <div className="bar-chart" aria-label="Revenue trend chart">
            {activityBars.map((height, index) => (
              <div className="bar-chart__item" key={index}>
                <span style={{ height: `${height}%` }} />
                <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-box">
          <div className="chart-box-inset">
            <PieChart
              title="Event status"
              data={pieChart.map((item: any) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
