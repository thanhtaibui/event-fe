import "../../styles/admin/dashboard.css";
import PieChart from "../../components/admin/dashboard/PieChart";
import DashboardCard from "../../components/admin/dashboard/DashboardCard";
// import LineChart from "../../components/dashboard/LineChart";
import { useDashboardInfo } from "../../hooks/admin/useDashboard";
import Loadingpage from "../../pages/LoadingPage";
export default function Dashboard() {
  const { data, loading } = useDashboardInfo();
  const iconMap: Record<string, string> = {
    organizations: "https://img.icons8.com/nolan/64/organization.png",
    users: "https://img.icons8.com/nolan/64/gender-neutral-user.png",
    events: "https://img.icons8.com/nolan/64/today.png",
    revenue: "https://img.icons8.com/nolan/64/total-sales-1.png",
    tickets: "https://img.icons8.com/nolan/64/ticket.png",
  };
  if (loading)
    return (
      <div>
        <Loadingpage />
      </div>
    );
  return (
    <div className="dashboard">
      {/* CARD ROW */}
      <div className="dashboard-cards">
        {data.cards.map((item: any) => (
          <DashboardCard
            key={item.key}
            title={item.title}
            value={item.value}
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

      {/* CHART ROW */}
      <div className="dashboard-charts">
        {/* LINE CHART */}
        <div className="chart-box">
          {/* sau bạn gắn LineChart vào đây */}
          <div style={{ color: "#fff" }}>Line Chart (Revenue)</div>
        </div>

        {/* PIE CHART */}
        <div className="chart-box">
          <div className="chart-box-inset">
            <PieChart
              title="Event status"
              data={data.pieChart.map((item: any) => ({
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
